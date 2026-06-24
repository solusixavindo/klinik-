import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getTrialEndDate, isPlanCode, DEFAULT_PLAN, type PlanCode } from "@/lib/billing"
import { friendlySupabaseSetupMessage } from "@/lib/supabaseEnv"
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

type ClinicInsertResult = {
  id: string
}

const missingColumn = (message?: string) =>
  Boolean(message && /column .* does not exist|could not find .* column|schema cache/i.test(message))

async function createClinic(clinicName: string, email: string, plan: PlanCode): Promise<ClinicInsertResult> {
  const now = new Date().toISOString()
  const trialEnd = getTrialEndDate()
  const payloads: Record<string, unknown>[] = [
    {
      name: clinicName,
      plan,
      package: plan,
      trial_plan: plan,
      subscription_status: "trialing",
      trial_start: now,
      trial_end: trialEnd,
      trial_ends_at: trialEnd,
      billing_email: email,
      updated_at: now,
    },
    {
      name: clinicName,
      plan,
      subscription_status: "trialing",
      trial_ends_at: trialEnd,
      billing_email: email,
      updated_at: now,
    },
    {
      name: clinicName,
      plan,
      subscription_status: "trialing",
      trial_ends_at: trialEnd,
      updated_at: now,
    },
    { name: clinicName },
  ]

  let lastError: Error | null = null

  for (const payload of payloads) {
    const { data, error } = await supabaseAdmin
      .from("clinics")
      .insert([payload])
      .select("id")
      .single()

    if (!error && data?.id) return data as ClinicInsertResult
    if (!missingColumn(error?.message)) throw error
    lastError = error
  }

  throw lastError || new Error("Gagal membuat data klinik")
}

async function createProfile(userId: string, clinicId: string, email: string) {
  const payloads = [
    { id: userId, clinic_id: clinicId, role: "admin", email },
    { id: userId, clinic_id: clinicId, role: "admin" },
  ]

  let lastError: Error | null = null

  for (const payload of payloads) {
    const { error } = await supabaseAdmin.from("profiles").insert([payload])
    if (!error) return
    if (!missingColumn(error.message)) throw error
    lastError = error
  }

  throw lastError || new Error("Gagal membuat profil admin")
}

async function recordTrialEvent(clinicId: string, plan: PlanCode, email: string) {
  const { error } = await supabaseAdmin.from("subscription_events").insert([
    {
      clinic_id: clinicId,
      event_type: "trial_started",
      provider: "xaviklinika",
      metadata: { plan, email, days: 14 },
    },
  ])

  if (error && !/relation .* does not exist|schema cache/i.test(error.message)) {
    console.warn("Register trial event skipped", error.message)
  }
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

    const clinic = await createClinic(clinicName, email, plan)

    if (!clinic) {
      // Hapus user kalau klinik gagal dibuat
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      throw new Error("Gagal membuat data klinik")
    }

    try {
      await createProfile(user.id, clinic.id, email)
    } catch (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      throw profileError
    }

    await recordTrialEvent(clinic.id, plan, email)

    return NextResponse.json({ success: true, email })
  } catch (err: unknown) {
    console.error("Register failed", err)
    const rawMessage = err instanceof Error ? err.message : ""
    const message =
      rawMessage.includes("Missing Supabase server environment variables")
        ? friendlySupabaseSetupMessage
        : rawMessage || "Pendaftaran belum berhasil. Mohon coba lagi."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
