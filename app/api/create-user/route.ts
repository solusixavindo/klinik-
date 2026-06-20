import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { DEFAULT_PLAN, getTrialEndDate, isPlanCode } from "@/lib/billing"

export async function POST(req: Request) {
  try {
    const { user_id, clinic_name, plan } = await req.json()

    if (!user_id || !clinic_name) {
      return NextResponse.json(
        { success: false, error: "user_id dan clinic_name wajib diisi" },
        { status: 400 }
      )
    }

    const selectedPlan = typeof plan === "string" && isPlanCode(plan) ? plan : DEFAULT_PLAN

    const clinicPayload = {
      name: clinic_name,
      plan: selectedPlan,
      subscription_status: selectedPlan === "trial" ? "trialing" : "active",
      trial_ends_at: selectedPlan === "trial" ? getTrialEndDate() : null,
      current_period_end: selectedPlan !== "trial" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    }

    let { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .insert([clinicPayload])
      .select()
      .single()

    if (clinicError?.message?.includes("Could not find")) {
      const fallback = await supabaseAdmin
        .from("clinics")
        .insert([{ name: clinic_name }])
        .select()
        .single()

      clinic = fallback.data
      clinicError = fallback.error
    }

    if (clinicError || !clinic) {
      throw clinicError || new Error("Gagal membuat klinik")
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert([
      {
        id: user_id,
        clinic_id: clinic.id,
        role: "admin",
      },
    ])

    if (profileError) {
      throw profileError
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
