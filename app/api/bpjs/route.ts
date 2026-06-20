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
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10)

    const { data, error } = await supabaseAdmin
      .from("bpjs_registrations")
      .select("*, patients(name, phone)")
      .eq("clinic_id", auth.clinicId)
      .eq("visit_date", date)
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, registrations: data ?? [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data BPJS"
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
    const { bpjs_number, patient_name, poli, referral_number, visit_date, notes, patient_id } = body

    if (!bpjs_number?.trim() || !patient_name?.trim() || !poli?.trim()) {
      return NextResponse.json({ success: false, error: "No. BPJS, nama pasien, dan poli tujuan wajib diisi" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("bpjs_registrations")
      .insert([{
        clinic_id: auth.clinicId,
        bpjs_number: bpjs_number.trim(),
        patient_name: patient_name.trim(),
        poli: poli.trim(),
        referral_number: referral_number?.trim() || null,
        visit_date: visit_date || new Date().toISOString().slice(0, 10),
        notes: notes || null,
        patient_id: patient_id || null,
        status: "registered",
      }])
      .select("*, patients(name, phone)")
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, registration: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mendaftarkan pasien BPJS"
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
    if (!id || !status) return NextResponse.json({ success: false, error: "ID dan status wajib diisi" }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from("bpjs_registrations")
      .update({ status })
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, registration: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal update status"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
