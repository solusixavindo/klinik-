import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const today = new Date().toISOString().slice(0, 10)

    const { data: plans, error } = await supabaseAdmin
      .from("recurring_plans")
      .select("*, patients(id, name, phone), doctors(id, name, specialization)")
      .eq("clinic_id", auth.clinicId)
      .order("created_at", { ascending: false })

    if (error) throw error

    const allPlans = plans || []
    const due_today = allPlans.filter(
      (p) => p.is_active && p.next_due_date != null && p.next_due_date <= today
    )

    return NextResponse.json({ success: true, plans: allPlans, due_today })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil recurring plans"
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
      name?: string
      amount?: number
      frequency?: string
      day_of_week?: number
      day_of_month?: number
      visit_type?: string
      notes?: string
      next_due_date?: string
    }

    const { patient_id, name, amount, frequency } = body

    if (!patient_id || !name || !amount || !frequency) {
      return NextResponse.json(
        { success: false, error: "Pasien, nama layanan, jumlah, dan frekuensi wajib diisi" },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("recurring_plans")
      .insert([{
        clinic_id: auth.clinicId,
        patient_id: body.patient_id,
        doctor_id: body.doctor_id || null,
        name: body.name,
        amount: body.amount,
        frequency: body.frequency,
        day_of_week: body.day_of_week ?? null,
        day_of_month: body.day_of_month ?? null,
        visit_type: body.visit_type || "regular",
        notes: body.notes || null,
        next_due_date: body.next_due_date || null,
        is_active: true,
      }])
      .select("*, patients(id, name, phone), doctors(id, name, specialization)")
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, plan: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat recurring plan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await req.json() as {
      id?: string
      amount?: number
      frequency?: string
      is_active?: boolean
      next_due_date?: string
      doctor_id?: string
      notes?: string
      name?: string
      day_of_week?: number
      day_of_month?: number
    }

    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID plan wajib diisi" }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...updateFields } = body

    const { data, error } = await supabaseAdmin
      .from("recurring_plans")
      .update(updateFields)
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
      .select("*, patients(id, name, phone), doctors(id, name, specialization)")
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, plan: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal update recurring plan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID plan wajib diisi" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("recurring_plans")
      .delete()
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus recurring plan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
