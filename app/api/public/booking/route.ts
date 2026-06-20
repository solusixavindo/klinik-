import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type BookingBody = {
  clinic_id?: unknown
  doctor_id?: unknown
  visit_date?: unknown
  patient_name?: unknown
  patient_phone?: unknown
  patient_email?: unknown
  notes?: unknown
}

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0

export async function POST(req: Request) {
  try {
    const body: BookingBody = await req.json().catch(() => ({}))

    const { clinic_id, doctor_id, visit_date, patient_name, patient_phone, patient_email, notes } = body

    if (!isNonEmptyString(clinic_id)) {
      return NextResponse.json({ success: false, error: "clinic_id wajib diisi" }, { status: 400 })
    }
    if (!isNonEmptyString(doctor_id)) {
      return NextResponse.json({ success: false, error: "doctor_id wajib diisi" }, { status: 400 })
    }
    if (!isNonEmptyString(visit_date)) {
      return NextResponse.json({ success: false, error: "visit_date wajib diisi" }, { status: 400 })
    }
    if (!isNonEmptyString(patient_name)) {
      return NextResponse.json({ success: false, error: "Nama pasien wajib diisi" }, { status: 400 })
    }
    if (!isNonEmptyString(patient_phone)) {
      return NextResponse.json({ success: false, error: "Nomor HP pasien wajib diisi" }, { status: 400 })
    }

    // Validate clinic exists and online booking is enabled
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("id, online_booking_enabled")
      .eq("id", clinic_id)
      .maybeSingle()

    if (clinicError || !clinic) {
      return NextResponse.json({ success: false, error: "Klinik tidak ditemukan" }, { status: 404 })
    }

    if (!clinic.online_booking_enabled) {
      return NextResponse.json({ success: false, error: "Booking online tidak aktif untuk klinik ini" }, { status: 403 })
    }

    // Validate doctor belongs to clinic
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from("doctors")
      .select("id, name")
      .eq("id", doctor_id)
      .eq("clinic_id", clinic_id)
      .maybeSingle()

    if (doctorError || !doctor) {
      return NextResponse.json({ success: false, error: "Dokter tidak ditemukan" }, { status: 404 })
    }

    // Upsert patient by clinic_id + phone
    const { data: existingPatient } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("clinic_id", clinic_id)
      .eq("phone", patient_phone.trim())
      .maybeSingle()

    let patientId: string

    if (existingPatient) {
      patientId = existingPatient.id
      // Update name if changed
      await supabaseAdmin
        .from("patients")
        .update({ name: patient_name.trim(), email: isNonEmptyString(patient_email) ? patient_email.trim() : undefined })
        .eq("id", patientId)
    } else {
      const { data: newPatient, error: patientError } = await supabaseAdmin
        .from("patients")
        .insert({
          clinic_id: clinic_id.trim(),
          name: patient_name.trim(),
          phone: patient_phone.trim(),
          email: isNonEmptyString(patient_email) ? patient_email.trim() : null,
        })
        .select("id")
        .single()

      if (patientError || !newPatient) {
        console.error("POST /api/public/booking patient insert:", patientError)
        return NextResponse.json({ success: false, error: "Gagal membuat data pasien" }, { status: 500 })
      }

      patientId = newPatient.id
    }

    // Count existing bookings on that date for queue number
    const { count } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinic_id)
      .eq("visit_date", visit_date.trim())

    const queueNumber = (count ?? 0) + 1

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        clinic_id: clinic_id.trim(),
        doctor_id: doctor_id.trim(),
        patient_id: patientId,
        visit_date: visit_date.trim(),
        payment_status: "pending",
        visit_type: "regular",
        notes: isNonEmptyString(notes) ? notes.trim() : null,
        queue_number: queueNumber,
      })
      .select("id, queue_number")
      .single()

    if (bookingError || !booking) {
      console.error("POST /api/public/booking insert:", bookingError)
      return NextResponse.json({ success: false, error: "Gagal membuat booking" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      queue_number: booking.queue_number ?? queueNumber,
      doctor_name: doctor.name,
      visit_date: visit_date.trim(),
      patient_name: patient_name.trim(),
    })
  } catch (err: unknown) {
    console.error("POST /api/public/booking failed", err)
    const message = err instanceof Error ? err.message : "Gagal memproses booking"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
