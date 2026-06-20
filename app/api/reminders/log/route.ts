import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const since = new Date()
    since.setDate(since.getDate() - 30)

    const { data, error } = await supabaseAdmin
      .from("reminder_logs")
      .select("*, bookings(id, visit_date, patients(name))")
      .eq("clinic_id", auth.clinicId)
      .gte("sent_at", since.toISOString())
      .order("sent_at", { ascending: false })

    if (error) {
      // Table may not exist yet — return empty gracefully
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ success: true, logs: [] })
      }
      console.error("REMINDER_LOG GET ERROR:", error)
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ success: true, logs: data ?? [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await req.json()
    const { booking_id, phone, message, status, error_message } = body as {
      booking_id?: string
      phone: string
      message: string
      status: string
      error_message?: string
    }

    const { data, error } = await supabaseAdmin
      .from("reminder_logs")
      .insert({
        clinic_id: auth.clinicId,
        booking_id: booking_id ?? null,
        phone,
        message,
        status,
        error_message: error_message ?? null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ success: true, log: null, warning: "Tabel reminder_logs belum dibuat" })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, log: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
