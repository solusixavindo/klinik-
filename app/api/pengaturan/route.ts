import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

export const runtime = "nodejs"

const CLINIC_SELECT = "*"

function errMsg(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message)
  }
  return fallback
}

export async function GET(req: Request) {
  const auth = await getClinicFromRequest(req)
  if (!("clinicId" in auth)) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { data: clinic, error } = await supabaseAdmin
    .from("clinics")
    .select(CLINIC_SELECT)
    .eq("id", auth.clinicId)
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, clinic })
}

export async function PATCH(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await req.json() as Record<string, unknown>
    const { name, address, phone, email } = body

    const updates: Record<string, unknown> = {}
    if (typeof name === "string") updates.name = name
    if (typeof address === "string") updates.address = address
    if (typeof phone === "string") updates.phone = phone
    if (typeof email === "string") updates.email = email

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "Tidak ada perubahan untuk disimpan" }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from("clinics")
      .update(updates)
      .eq("id", auth.clinicId)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    const { data: clinic, error: fetchError } = await supabaseAdmin
      .from("clinics")
      .select(CLINIC_SELECT)
      .eq("id", auth.clinicId)
      .single()

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, clinic })
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: errMsg(err, "Gagal menyimpan pengaturan") }, { status: 500 })
  }
}
