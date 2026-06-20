import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"
import { sendWhatsApp, WA_TEMPLATES } from "@/lib/whatsapp"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10)

    const { data, error } = await supabaseAdmin
      .from("lab_requests")
      .select("*, patients(name, phone), doctors(name, specialization)")
      .eq("clinic_id", auth.clinicId)
      .eq("request_date", date)
      .order("created_at", { ascending: false })

    if (error) {
      if (
        error.code === "42P01" ||
        error.message?.toLowerCase().includes("lab_requests") ||
        error.message?.toLowerCase().includes("does not exist")
      ) {
        return NextResponse.json({ success: false, tableNotFound: true, error: "Tabel lab_requests belum ada" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ success: true, requests: data ?? [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data lab"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await req.json() as {
      patient_id?: string
      doctor_id?: string
      request_date?: string
      test_types?: string[]
      notes?: string
    }

    const { patient_id, doctor_id, request_date, test_types, notes } = body

    if (!patient_id || !test_types || test_types.length === 0) {
      return NextResponse.json({ success: false, error: "Pasien dan jenis pemeriksaan wajib diisi" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("lab_requests")
      .insert([{
        clinic_id: auth.clinicId,
        patient_id,
        doctor_id: doctor_id || null,
        request_date: request_date || new Date().toISOString().slice(0, 10),
        test_types,
        notes: notes || null,
        status: "pending",
      }])
      .select("*, patients(name, phone), doctors(name, specialization)")
      .single()

    if (error) {
      if (
        error.code === "42P01" ||
        error.message?.toLowerCase().includes("lab_requests") ||
        error.message?.toLowerCase().includes("does not exist")
      ) {
        return NextResponse.json({ success: false, tableNotFound: true, error: "Tabel lab_requests belum ada" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ success: true, request: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat permintaan lab"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await req.json() as { id?: string; status?: string; result?: string }
    const { id, status, result } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "ID wajib diisi" }, { status: 400 })
    }

    const validStatuses = ["pending", "proses", "selesai"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Status tidak valid" }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (result !== undefined) updates.result = result

    const { data, error } = await supabaseAdmin
      .from("lab_requests")
      .update(updates)
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
      .select("*, patients(name, phone), doctors(name, specialization)")
      .single()

    if (error) throw error

    // Kirim WA saat hasil lab selesai (fire and forget)
    if (status === "selesai" && data) {
      const patientPhone = (data.patients as { phone?: string } | null)?.phone
      if (patientPhone) {
        const testTypes = (data.test_types as string[] | null) ?? []
        void sendWhatsApp(
          patientPhone,
          WA_TEMPLATES.labReady({
            patientName: (data.patients as { name: string }).name,
            testTypes,
          })
        )
      }
    }

    return NextResponse.json({ success: true, request: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal update permintaan lab"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
