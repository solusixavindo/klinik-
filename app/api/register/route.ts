import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getTrialEndDate, isPlanCode, DEFAULT_PLAN, type PlanCode } from "@/lib/billing"
import {
  hasValidSupabaseServiceRoleKey,
  serviceRoleMisconfiguredResponse,
} from "@/lib/supabaseServiceRoleCheck"

type RegisterBody = {
  clinic_name?: unknown
  email?: unknown
  password?: unknown
  plan?: unknown
}

export async function POST(req: Request) {
  try {
    if (!hasValidSupabaseServiceRoleKey()) {
      return serviceRoleMisconfiguredResponse()
    }

    const body = (await req.json()) as RegisterBody
    const clinicName = typeof body.clinic_name === "string" ? body.clinic_name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const planRaw = typeof body.plan === "string" ? body.plan : DEFAULT_PLAN
    const plan: PlanCode = isPlanCode(planRaw) ? planRaw : DEFAULT_PLAN

    if (!clinicName || clinicName.length < 3) {
      return NextResponse.json(
        { success: false, error: "Nama klinik minimal 3 karakter" },
        { status: 400 }
      )
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Format email tidak valid" },
        { status: 400 }
      )
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password minimal 8 karakter" },
        { status: 400 }
      )
    }

    // Buat user baru
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        clinic_name: clinicName,
        plan,
      },
    })

    if (userError) {
      const msg = userError.message.toLowerCase()
      if (msg.includes("already") || msg.includes("exist")) {
        return NextResponse.json(
          { success: false, error: "Email sudah terdaftar. Silakan login atau gunakan email lain." },
          { status: 409 }
        )
      }
      throw userError
    }

    if (!userData.user) {
      throw new Error("Gagal membuat akun")
    }

    const user = userData.user

    // Buat klinik
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .insert([
        {
          name: clinicName,
          plan,
          subscription_status: "trialing",
          trial_ends_at: getTrialEndDate(),
          billing_email: email,
          updated_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single()

    if (clinicError || !clinic) {
      // Hapus user kalau klinik gagal dibuat
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      throw clinicError || new Error("Gagal membuat data klinik")
    }

    // Buat profil
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: user.id,
          clinic_id: clinic.id,
          role: "admin",
        },
      ])

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      throw profileError
    }

    return NextResponse.json({ success: true, email })
  } catch (err: unknown) {
    console.error("Register failed", err)
    const rawMessage = err instanceof Error ? err.message : ""
    const message =
      rawMessage.includes("Missing Supabase server environment variables")
        ? "Konfigurasi Supabase server belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di Vercel, lalu redeploy."
        : rawMessage || "Gagal mendaftarkan klinik"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
