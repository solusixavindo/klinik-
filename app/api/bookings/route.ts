import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"
import { getPlan, getRemainingQuota, PlanCode } from "@/lib/billing"
import { resolveEffectivePlanCode } from "@/lib/resolveEffectivePlan"
import { sendWhatsApp, WA_TEMPLATES } from "@/lib/whatsapp"

type BookingRequest = {
  patient_id?: unknown
  doctor_id?: unknown
  visit_date?: unknown
  price?: unknown
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

const isMissingClinicPlanColumn = (error: { code?: string; message?: string } | null | undefined) =>
  error?.code === "42703" ||
  error?.code === "PGRST204" ||
  error?.message?.toLowerCase().includes("column clinics")

export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)

    if (!("clinicId" in auth)) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status || 500 }
      )
    }

    const clinicId = auth.clinicId

    const [patientsRes, doctorsRes, bookingsRes] = await Promise.all([
      supabaseAdmin
        .from("patients")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("doctors")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("bookings")
        .select("*, patients(*), doctors(*)")
        .eq("clinic_id", clinicId)
        .order("visit_date", { ascending: false }),
    ])

    if (patientsRes.error || doctorsRes.error || bookingsRes.error) {
      throw patientsRes.error || doctorsRes.error || bookingsRes.error
    }

    return NextResponse.json({
      success: true,
      patients: patientsRes.data || [],
      doctors: doctorsRes.data || [],
      bookings: bookingsRes.data || [],
    })
  } catch (err: unknown) {
    console.error("Fetch bookings failed", err)
    const message = err instanceof Error ? err.message : "Gagal mengambil data booking"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)

    if (!("clinicId" in auth)) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status || 500 }
      )
    }

    const body = (await req.json()) as BookingRequest
    const { patient_id, doctor_id, visit_date, price } = body

    if (!isNonEmptyString(patient_id) || !isNonEmptyString(doctor_id) || !isNonEmptyString(visit_date)) {
      return NextResponse.json(
        { success: false, error: "Pasien, dokter, dan tanggal kunjungan wajib diisi" },
        { status: 400 }
      )
    }

    const numericPrice = Number(price)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Harga harus angka positif" },
        { status: 400 }
      )
    }

    const clinicId = auth.clinicId

    // Check booking limit
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("plan")
      .eq("id", clinicId)
      .single()

    if (clinicError && !isMissingClinicPlanColumn(clinicError)) {
      throw clinicError || new Error("Klinik tidak ditemukan")
    }

    const selectedPlan = resolveEffectivePlanCode(clinic?.plan, auth.user)
    const plan = getPlan(selectedPlan)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

    const { count: monthlyBookings, error: countError } = await supabaseAdmin
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd)

    if (countError) throw countError

    const bookingCount = monthlyBookings || 0
    const remaining = getRemainingQuota(selectedPlan as PlanCode | undefined, "bookingsPerMonth", bookingCount)

    if (remaining <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Paket ${plan.name} sudah mencapai batas booking bulan ini (${plan.limits.bookingsPerMonth}). Upgrade paket atau tunggu bulan depan.`,
          current: bookingCount,
          limit: plan.limits.bookingsPerMonth,
        },
        { status: 403 }
      )
    }

    const [{ data: patient }, { data: doctor }] = await Promise.all([
      supabaseAdmin
        .from("patients")
        .select("id")
        .eq("id", patient_id.trim())
        .eq("clinic_id", clinicId)
        .single(),
      supabaseAdmin
        .from("doctors")
        .select("id")
        .eq("id", doctor_id.trim())
        .eq("clinic_id", clinicId)
        .single(),
    ])

    if (!patient || !doctor) {
      return NextResponse.json(
        { success: false, error: "Pasien atau dokter tidak terdaftar di klinik ini" },
        { status: 400 }
      )
    }

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert([
        {
          patient_id: patient_id.trim(),
          doctor_id: doctor_id.trim(),
          visit_date: visit_date.trim(),
          price: numericPrice,
          clinic_id: clinicId,
          payment_status: "pending",
        },
      ])
      .select("*, patients(*), doctors(*)")
      .single()

    if (error || !booking) {
      throw error || new Error("Booking berhasil dikirim, tetapi data hasil insert tidak ditemukan")
    }

    // Kirim WA konfirmasi (fire and forget)
    const patientPhone = (booking.patients as { phone?: string } | null)?.phone
    if (patientPhone) {
      const { data: clinicData } = await supabaseAdmin.from("clinics").select("name").eq("id", clinicId).single()
      void sendWhatsApp(
        patientPhone,
        WA_TEMPLATES.bookingConfirm({
          patientName: (booking.patients as { name: string }).name,
          doctorName: (booking.doctors as { name: string }).name,
          date: booking.visit_date as string,
          clinicName: clinicData?.name ?? "Klinik",
        })
      )
    }

    return NextResponse.json({ success: true, booking, remaining: remaining - 1 })
  } catch (err: unknown) {
    console.error("Create booking failed", err)
    const message = err instanceof Error ? err.message : "Gagal membuat booking"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 500 })
    }

    const body = await req.json() as { id?: string; payment_status?: string }
    const { id, payment_status } = body

    if (!id || !payment_status) {
      return NextResponse.json({ success: false, error: "ID dan payment_status wajib diisi" }, { status: 400 })
    }

    const validStatuses = ["pending", "partial", "paid", "cancelled"]
    if (!validStatuses.includes(payment_status)) {
      return NextResponse.json({ success: false, error: "Status tidak valid" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({ payment_status })
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
      .select("id, payment_status")
      .single()

    if (error || !data) throw error || new Error("Booking tidak ditemukan")

    return NextResponse.json({ success: true, booking: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal update status pembayaran"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
