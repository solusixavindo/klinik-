import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getTrialEndDate, isPlanCode, DEFAULT_PLAN, type PlanCode } from "@/lib/billing"
import { getSupabaseEnvStatus } from "@/lib/supabaseEnv"
import { hasValidSupabaseServiceRoleKey } from "@/lib/supabaseServiceRoleCheck"

type RegisterBody = {
  clinic_name?: unknown
  clinicName?: unknown
  email?: unknown
  password?: unknown
  plan?: unknown
  package?: unknown
}

type ClinicInsertResult = {
  id: string
}

const missingColumn = (message?: string) =>
  Boolean(message && /column .* does not exist|could not find .* column|schema cache/i.test(message))

const logRegisterError = (step: string, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error("REGISTER_ERROR", { step, message })
}

const errorResponse = (error: string, status = 500, code?: string) =>
  NextResponse.json({ success: false, error, code }, { status })

const mapDatabaseError = (message: string) => {
  const lower = message.toLowerCase()

  if (lower.includes("row-level security") || lower.includes("violates row-level security")) {
    return {
      status: 403,
      code: "RLS_DENIED",
      error: "Supabase menolak insert karena RLS/policy. Jalankan production_ready.sql dan pastikan service role key benar.",
    }
  }

  if (missingColumn(message) || lower.includes("pgrst204")) {
    return {
      status: 500,
      code: "SCHEMA_MISMATCH",
      error: `Schema Supabase belum cocok: ${message}. Jalankan supabase/production_ready.sql lalu redeploy.`,
    }
  }

  if (lower.includes("duplicate") || lower.includes("unique")) {
    return {
      status: 409,
      code: "DUPLICATE_DATA",
      error: "Data klinik/profil sudah ada. Gunakan email lain atau hubungi admin.",
    }
  }

  return { status: 500, code: "REGISTER_FAILED", error: message || "Pendaftaran belum berhasil. Mohon coba lagi." }
}

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
  let step = "init"
  let createdUserId: string | null = null

  try {
    if (!hasValidSupabaseServiceRoleKey()) {
      const env = getSupabaseEnvStatus()
      const missing = Object.entries(env)
        .filter(([, ok]) => !ok)
        .map(([key]) => key)
      return errorResponse(
        `ENV Supabase belum lengkap atau service role key salah: ${missing.join(", ") || "SUPABASE_SERVICE_ROLE_KEY"}.`,
        503,
        "SUPABASE_ENV_MISSING"
      )
    }

    step = "parse_payload"
    const body = (await req.json()) as RegisterBody
    const rawClinicName =
      typeof body.clinicName === "string"
        ? body.clinicName
        : typeof body.clinic_name === "string"
          ? body.clinic_name
          : ""
    const clinicName = rawClinicName.trim()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const planRaw =
      typeof body.plan === "string"
        ? body.plan
        : typeof body.package === "string"
          ? body.package
          : DEFAULT_PLAN
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

    step = "create_auth_user"
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
        logRegisterError(step, userError)
        return errorResponse("Email sudah terdaftar. Silakan login atau gunakan email lain.", 409, "EMAIL_EXISTS")
      }
      throw userError
    }

    if (!userData.user) {
      throw new Error("Gagal membuat akun")
    }

    const user = userData.user
    createdUserId = user.id

    step = "create_clinic"
    const clinic = await createClinic(clinicName, email, plan)

    step = "create_profile"
    await createProfile(user.id, clinic.id, email)

    step = "record_trial"
    await recordTrialEvent(clinic.id, plan, email)

    return NextResponse.json({ success: true, email })
  } catch (err: unknown) {
    logRegisterError(step, err)
    if (createdUserId && step !== "record_trial") {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch((cleanupError) => {
        logRegisterError("cleanup_auth_user", cleanupError)
      })
    }

    const rawMessage = err instanceof Error ? err.message : ""
    const mapped = mapDatabaseError(rawMessage)
    return errorResponse(mapped.error, mapped.status, mapped.code)
  }
}
