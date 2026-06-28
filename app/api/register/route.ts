import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getTrialEndDate, isPlanCode, type PlanCode } from "@/lib/billing"
import { friendlySupabaseSetupMessage, getSupabaseEnvCheck, type SupabaseEnvCheck } from "@/lib/supabaseEnv"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

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

const logRegisterError = (step: string, error: unknown, envCheck?: SupabaseEnvCheck) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error("REGISTER_ERROR", { step, reason: message, ...(envCheck ? { envCheck } : {}) })
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
  const ip = getClientIp(req)
  const rate = checkRateLimit(ip)
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)) } }
    )
  }

  let step = "init"
  let createdUserId: string | null = null
  let envCheck: SupabaseEnvCheck | undefined

  try {
    step = "validate_env"
    envCheck = getSupabaseEnvCheck()
    if (!envCheck.ready) {
      logRegisterError(step, new Error(envCheck.reason || "Supabase env belum siap"), envCheck)
      return NextResponse.json(
        {
          success: false,
          error: friendlySupabaseSetupMessage,
          code: "SUPABASE_ENV_NOT_READY",
          reason: envCheck.reason,
        },
        { status: 503 }
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
          : ""
    const plan: PlanCode | null = isPlanCode(planRaw) ? planRaw : null

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

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Pilih paket trial yang valid" },
        { status: 400 }
      )
    }

    step = "create_auth_user"
    // Direct fetch to Supabase Auth Admin API — bypasses supabase-js URL construction
    // which caused "Invalid path specified in request URL" on some Vercel deployments
    const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    const supabaseBase = rawSupabaseUrl.replace(/\s+/g, "").replace(/\/+$/, "")
    const authAdminUrl = `${supabaseBase}/auth/v1/admin/users`

    const authRes = await fetch(authAdminUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { clinic_name: clinicName, plan },
      }),
    })

    type AuthUser = { id: string; email: string }
    type AuthResponse = { id?: string; email?: string; msg?: string; message?: string; error_description?: string }
    const authJson = await authRes.json() as AuthResponse

    if (!authRes.ok || !authJson.id) {
      const msg = (authJson.msg ?? authJson.message ?? authJson.error_description ?? "").toLowerCase()
      if (msg.includes("already") || msg.includes("exist") || authRes.status === 422) {
        logRegisterError(step, new Error(msg))
        return errorResponse("Email sudah terdaftar. Silakan login atau gunakan email lain.", 409, "EMAIL_EXISTS")
      }
      throw new Error(authJson.msg ?? authJson.message ?? `Auth API ${authRes.status}`)
    }

    const user: AuthUser = { id: authJson.id, email: authJson.email ?? email }
    createdUserId = user.id

    step = "create_clinic"
    const clinic = await createClinic(clinicName, email, plan)

    step = "create_profile"
    await createProfile(user.id, clinic.id, email)

    step = "record_trial"
    await recordTrialEvent(clinic.id, plan, email)

    return NextResponse.json({ success: true, email, redirectTo: "/login?registered=1" })
  } catch (err: unknown) {
    logRegisterError(step, err, envCheck)
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
