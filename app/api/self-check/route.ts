import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { hasValidSupabaseServiceRoleKey } from "@/lib/supabaseServiceRoleCheck"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type ClinicAuditRow = {
  id: string
  plan?: string | null
  package?: string | null
  trial_plan?: string | null
  trial_start?: string | null
  trial_end?: string | null
  trial_ends_at?: string | null
}

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0

async function getClinicAuditRow(clinicId: string) {
  const primary = await supabaseAdmin
    .from("clinics")
    .select("id, plan, package, trial_plan, trial_start, trial_end, trial_ends_at")
    .eq("id", clinicId)
    .maybeSingle()

  if (!primary.error) return primary.data as ClinicAuditRow | null

  const fallback = await supabaseAdmin
    .from("clinics")
    .select("id")
    .eq("id", clinicId)
    .maybeSingle()

  return (fallback.data as ClinicAuditRow | null) ?? null
}

export async function GET(req: Request) {
  if (!hasValidSupabaseServiceRoleKey()) {
    return NextResponse.json({
      auth: false,
      clinic: false,
      profile: false,
      plan: false,
      trial: false,
    })
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) {
    return NextResponse.json({
      auth: false,
      clinic: false,
      profile: false,
      plan: false,
      trial: false,
    })
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData.user) {
    return NextResponse.json({
      auth: false,
      clinic: false,
      profile: false,
      plan: false,
      trial: false,
    })
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, clinic_id, role")
    .eq("id", userData.user.id)
    .maybeSingle()

  const profileOk = Boolean(profile?.id && profile?.clinic_id && profile?.role === "admin")
  const clinicRow = profile?.clinic_id ? await getClinicAuditRow(profile.clinic_id) : null
  const clinicOk = Boolean(clinicRow?.id)
  const planOk = Boolean(
    hasText(clinicRow?.plan) ||
    hasText(clinicRow?.package) ||
    hasText(clinicRow?.trial_plan)
  )
  const trialOk = Boolean(
    hasText(clinicRow?.trial_start) ||
    hasText(clinicRow?.trial_end) ||
    hasText(clinicRow?.trial_ends_at)
  )

  return NextResponse.json({
    auth: true,
    clinic: clinicOk,
    profile: profileOk,
    plan: planOk,
    trial: trialOk,
  })
}
