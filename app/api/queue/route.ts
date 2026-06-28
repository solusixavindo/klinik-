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
    const type = searchParams.get("type") || "poli"
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10)

    const { data, error } = await supabaseAdmin
      .from("queue_entries")
      .select("*, patients(name, phone), doctors(name, specialization)")
      .eq("clinic_id", auth.clinicId)
      .eq("queue_type", type)
      .eq("queue_date", date)
      .order("queue_number", { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, queue: data ?? [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data antrian"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await req.json()
    const { patient_id, doctor_id, queue_type, queue_date, notes } = body

    if (!patient_id || !queue_type) {
      return NextResponse.json({ success: false, error: "Pasien dan tipe antrian wajib diisi" }, { status: 400 })
    }

    const date = queue_date || new Date().toISOString().slice(0, 10)

    // Cari nomor antrian berikutnya untuk hari dan tipe ini
    const { data: lastQueue } = await supabaseAdmin
      .from("queue_entries")
      .select("queue_number")
      .eq("clinic_id", auth.clinicId)
      .eq("queue_type", queue_type)
      .eq("queue_date", date)
      .order("queue_number", { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextNumber = (lastQueue?.queue_number ?? 0) + 1

    const { data, error } = await supabaseAdmin
      .from("queue_entries")
      .insert([{
        clinic_id: auth.clinicId,
        patient_id,
        doctor_id: doctor_id || null,
        queue_type,
        queue_number: nextNumber,
        queue_date: date,
        status: "waiting",
        notes: notes || null,
      }])
      .select("*, patients(name, phone), doctors(name, specialization)")
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, entry: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambah antrian"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "ID dan status wajib diisi" }, { status: 400 })
    }

    const validStatuses = ["waiting", "called", "serving", "done", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Status tidak valid" }, { status: 400 })
    }

    const updates: Record<string, unknown> = { status }
    if (status === "called") updates.called_at = new Date().toISOString()
    if (status === "serving") updates.served_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from("queue_entries")
      .update(updates)
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
      .select("*, patients(name, phone), doctors(name, specialization)")
      .single()

    if (error) throw error

    // Kirim WA saat antrian dipanggil (fire and forget)
    if (status === "called" && data) {
      const patientData = data.patients as { phone?: string; name?: string } | null
      const patientPhone = patientData?.phone
      if (patientPhone && patientData?.name) {
        const poliName = (data.doctors as { specialization?: string } | null)?.specialization ?? "Poli"
        sendWhatsApp(
          patientPhone,
          WA_TEMPLATES.queueCalled({
            patientName: patientData.name,
            queueNumber: data.queue_number as number,
            poli: poliName,
          })
        ).catch((err) => console.error("WA queueCalled failed:", err))
      }
    }

    return NextResponse.json({ success: true, entry: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal update antrian"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
