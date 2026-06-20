import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get("patient_id")

    let query = supabaseAdmin
      .from("medical_records")
      .select("*, patients(name, phone, date_of_birth), doctors(name, specialization)")
      .eq("clinic_id", auth.clinicId)
      .order("visit_date", { ascending: false })
      .limit(50)

    if (patientId) query = query.eq("patient_id", patientId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, records: data ?? [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil rekam medis"
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
    const { patient_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment, prescription, notes,
      systolic_bp, diastolic_bp, heart_rate, temperature, weight, height, booking_id } = body

    if (!patient_id || !doctor_id || !visit_date) {
      return NextResponse.json({ success: false, error: "Pasien, dokter, dan tanggal wajib diisi" }, { status: 400 })
    }

    // Validasi pasien & dokter milik klinik ini
    const [patientRes, doctorRes] = await Promise.all([
      supabaseAdmin.from("patients").select("id").eq("id", patient_id).eq("clinic_id", auth.clinicId).single(),
      supabaseAdmin.from("doctors").select("id").eq("id", doctor_id).eq("clinic_id", auth.clinicId).single(),
    ])

    if (!patientRes.data || !doctorRes.data) {
      return NextResponse.json({ success: false, error: "Pasien atau dokter tidak ditemukan di klinik ini" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("medical_records")
      .insert([{
        clinic_id: auth.clinicId,
        patient_id, doctor_id, visit_date, booking_id: booking_id || null,
        chief_complaint: chief_complaint || null,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        prescription: prescription || null,
        notes: notes || null,
        systolic_bp: systolic_bp ? Number(systolic_bp) : null,
        diastolic_bp: diastolic_bp ? Number(diastolic_bp) : null,
        heart_rate: heart_rate ? Number(heart_rate) : null,
        temperature: temperature ? Number(temperature) : null,
        weight: weight ? Number(weight) : null,
        height: height ? Number(height) : null,
        updated_at: new Date().toISOString(),
      }])
      .select("*, patients(name), doctors(name, specialization)")
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, record: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan rekam medis"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID wajib diisi" }, { status: 400 })

    const { error } = await supabaseAdmin
      .from("medical_records")
      .delete()
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus rekam medis"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
