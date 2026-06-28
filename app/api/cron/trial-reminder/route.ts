import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { sendWhatsApp } from "@/lib/whatsapp"
import { PLANS, type PlanCode } from "@/lib/billing"

export const runtime = "nodejs"

// Called daily by Vercel Cron or external cron.
// Sends WA reminder to clinics whose trial expires in 3 days.
// Protect with CRON_SECRET so only Vercel scheduler can call it.

export async function GET(req: Request) {
  // Vercel sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization")
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date()
  const targetDay = new Date(today)
  targetDay.setDate(today.getDate() + 3)
  const dateStr = targetDay.toISOString().slice(0, 10) // "YYYY-MM-DD"

  const { data: clinics, error } = await supabaseAdmin
    .from("clinics")
    .select("id, name, phone, plan, trial_ends_at")
    .eq("subscription_status", "trialing")
    .gte("trial_ends_at", `${dateStr}T00:00:00`)
    .lte("trial_ends_at", `${dateStr}T23:59:59`)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const results: { clinic: string; phone: string; sent: boolean; error?: string }[] = []

  for (const clinic of clinics ?? []) {
    if (!clinic.phone) {
      results.push({ clinic: clinic.name, phone: "", sent: false, error: "Nomor HP belum diatur" })
      continue
    }

    const planName = PLANS[(clinic.plan as PlanCode) ?? "basic"]?.name ?? clinic.plan
    const message =
      `Halo! 👋 Ini pengingat dari *XaviKlinika*.\n\n` +
      `Masa trial *14 hari* klinik *${clinic.name}* akan berakhir dalam *3 hari* (paket ${planName}).\n\n` +
      `Agar operasional klinik tidak terganggu, segera perpanjang langganan di:\n` +
      `👉 https://klinik.xavindo.com/billing\n\n` +
      `Butuh bantuan? Balas pesan ini. Terima kasih 🙏`

    const result = await sendWhatsApp(clinic.phone, message)
    results.push({ clinic: clinic.name, phone: clinic.phone, sent: result.success, error: result.error })
  }

  const sent = results.filter((r) => r.sent).length
  return NextResponse.json({ success: true, date: dateStr, total: results.length, sent, results })
}
