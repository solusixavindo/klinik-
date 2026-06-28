import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

interface ReminderResult {
  phone: string
  status: "sent" | "failed"
  response?: string
  error?: string
}

export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { data: clinicData } = await supabaseAdmin
      .from("clinics").select("fonnte_token").eq("id", auth.clinicId).single()
    const token = clinicData?.fonnte_token || process.env.FONNTE_TOKEN
    if (!token) {
      return NextResponse.json({ success: false, error: "Token Fonnte belum dikonfigurasi" }, { status: 500 })
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const date = tomorrow.toISOString().split("T")[0]

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*, patients(name, phone), doctors(name)")
      .eq("visit_date", date)
      .eq("clinic_id", auth.clinicId)

    if (error) {
      console.error("SUPABASE ERROR:", error)
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, total: 0, results: [] })
    }

    const results: ReminderResult[] = []

    for (const b of data) {
      const phone08 = b.patients?.phone || ""
      const phone62 = phone08.replace(/^0/, "62")
      const message = `Halo ${b.patients?.name},
Reminder kunjungan besok dengan dokter ${b.doctors?.name}.

Tanggal: ${b.visit_date}
Mohon datang 15 menit lebih awal 🙏`

      try {
        const res = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            Authorization: token,
          },
          body: new URLSearchParams({ target: phone62, message }),
        })

        const text = await res.text()
        const sent = text.includes("true")
        results.push({ phone: phone62, status: sent ? "sent" : "failed", response: text })

        // Log to reminder_logs
        await supabaseAdmin.from("reminder_logs").insert({
          clinic_id: auth.clinicId,
          booking_id: b.id,
          phone: phone62,
          message,
          status: sent ? "sent" : "failed",
          error_message: sent ? null : text,
        }).then(() => {}, () => {})
      } catch (err: unknown) {
        console.error("SEND ERROR:", err)
        const errMsg = err instanceof Error ? err.message : "Error mengirim pesan"
        results.push({ phone: phone62, status: "failed", error: errMsg })

        await supabaseAdmin.from("reminder_logs").insert({
          clinic_id: auth.clinicId,
          booking_id: b.id,
          phone: phone62,
          message,
          status: "failed",
          error_message: errMsg,
        }).then(() => {}, () => {})
      }
    }

    return NextResponse.json({ success: true, total: results.length, results })
  } catch (err: unknown) {
    console.error("GLOBAL ERROR:", err)
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

    const { data: clinicData } = await supabaseAdmin
      .from("clinics").select("fonnte_token").eq("id", auth.clinicId).single()
    const token = clinicData?.fonnte_token || process.env.FONNTE_TOKEN
    if (!token) {
      return NextResponse.json({ success: false, error: "Token Fonnte belum dikonfigurasi" }, { status: 500 })
    }

    const body = await req.json()
    const { booking_id, custom_message } = body as { booking_id: string; custom_message?: string }

    if (!booking_id) {
      return NextResponse.json({ success: false, error: "booking_id wajib diisi" }, { status: 400 })
    }

    const { data: b, error } = await supabaseAdmin
      .from("bookings")
      .select("*, patients(name, phone), doctors(name)")
      .eq("id", booking_id)
      .eq("clinic_id", auth.clinicId)
      .single()

    if (error || !b) {
      return NextResponse.json({ success: false, error: "Booking tidak ditemukan" }, { status: 404 })
    }

    const phone08 = b.patients?.phone || ""
    const phone62 = phone08.replace(/^0/, "62")
    const message = custom_message || `Halo ${b.patients?.name},
Reminder kunjungan besok dengan dokter ${b.doctors?.name}.

Tanggal: ${b.visit_date}
Mohon datang 15 menit lebih awal 🙏`

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body: new URLSearchParams({ target: phone62, message }),
    })

    const text = await res.text()
    const sent = text.includes("true")
    const status = sent ? "sent" : "failed"

    await supabaseAdmin.from("reminder_logs").insert({
      clinic_id: auth.clinicId,
      booking_id: b.id,
      phone: phone62,
      message,
      status,
      error_message: sent ? null : text,
    }).then(() => {}, () => {})

    return NextResponse.json({ success: true, phone: phone62, status, response: text })
  } catch (err: unknown) {
    console.error("POST REMINDER ERROR:", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
