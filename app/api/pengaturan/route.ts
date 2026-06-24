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

    const { data: clinic, error } = await supabaseAdmin
      .from("clinics")
      .select("id, name, address, phone, email, slug, logo_url, online_booking_enabled, plan, subscription_status, trial_ends_at, current_period_end")
      .eq("id", auth.clinicId)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, clinic })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil pengaturan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await req.json()
    const { name, address, phone, email } = body

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (address !== undefined) updates.address = address
    if (phone !== undefined) updates.phone = phone
    if (email !== undefined) updates.email = email

    const { data, error } = await supabaseAdmin
      .from("clinics")
      .update(updates)
      .eq("id", auth.clinicId)
      .select("id, name, address, phone, email, slug, logo_url, online_booking_enabled, plan, subscription_status, trial_ends_at, current_period_end")
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, clinic: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan pengaturan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
