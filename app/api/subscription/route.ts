import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getDaysRemaining, getNextBillingDate, getPlan } from "@/lib/billing"
import { resolveEffectivePlanCode } from "@/lib/resolveEffectivePlan"
import {
  hasValidSupabaseServiceRoleKey,
  serviceRoleMisconfiguredResponse,
} from "@/lib/supabaseServiceRoleCheck"

export const runtime = "nodejs"

const isMissingClinicSaasColumn = (error: { code?: string; message?: string } | null | undefined) =>
  error?.code === "42703" ||
  error?.code === "PGRST204" ||
  error?.message?.toLowerCase().includes("column clinics")

export async function GET(req: Request) {
  try {
    if (!hasValidSupabaseServiceRoleKey()) {
      return serviceRoleMisconfiguredResponse()
    }

    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Sesi login tidak ditemukan" },
        { status: 401 }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: "Sesi login tidak valid" },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("clinic_id")
      .eq("id", userData.user.id)
      .single()

    if (profileError || !profile?.clinic_id) {
      return NextResponse.json(
        { success: false, error: "Data klinik tidak ditemukan" },
        { status: 403 }
      )
    }

    let { data: clinic, error } = await supabaseAdmin
      .from("clinics")
      .select("id, name, plan, subscription_status, trial_ends_at, current_period_end")
      .eq("id", profile.clinic_id)
      .single()

    if (error && isMissingClinicSaasColumn(error)) {
      const fallback = await supabaseAdmin
        .from("clinics")
        .select("id, name")
        .eq("id", profile.clinic_id)
        .single()

      clinic = fallback.data
        ? {
            ...fallback.data,
            plan: null,
            subscription_status: null,
            trial_ends_at: null,
            current_period_end: null,
          }
        : null
      error = fallback.error
    }

    if (error || !clinic) {
      throw error || new Error("Data langganan tidak ditemukan")
    }

    const selectedPlan = resolveEffectivePlanCode(clinic.plan, userData.user)
    const plan = getPlan(selectedPlan)
    const daysRemaining = getDaysRemaining(clinic.trial_ends_at)
    const status = clinic.subscription_status || (selectedPlan === "trial" ? "trialing" : "active")
    const isTrialExpired = status === "trialing" && daysRemaining <= 0

    return NextResponse.json({
      success: true,
      subscription: {
        clinic_id: clinic.id,
        clinic_name: clinic.name,
        plan,
        status: isTrialExpired ? "past_due" : status,
        trial_ends_at: clinic.trial_ends_at,
        current_period_end: clinic.current_period_end || (selectedPlan === "trial" ? null : getNextBillingDate()),
        days_remaining: daysRemaining,
        is_active: status === "active" || (status === "trialing" && daysRemaining > 0),
      },
    })
  } catch (err: unknown) {
    console.error("Fetch subscription failed", err)
    const message = err instanceof Error ? err.message : "Gagal mengambil data langganan"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
