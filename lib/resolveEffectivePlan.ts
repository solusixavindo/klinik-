import type { User } from "@supabase/supabase-js"
import { DEFAULT_PLAN, isPlanCode, type PlanCode } from "@/lib/billing"
import { getDemoAccountByEmail } from "@/lib/demoAccounts"

/**
 * Paket efektif untuk UI dan kuota API.
 *
 * Demo: utamakan metadata.plan; jika kosong/salah, pakai paket dari DEMO_ACCOUNTS sesuai email.
 * Non-demo: clinics.plan lalu metadata lalu trial.
 */
export function resolveEffectivePlanCode(
  clinicPlan: string | null | undefined,
  user: Pick<User, "user_metadata" | "email"> | null | undefined
): PlanCode {
  const meta = user?.user_metadata as Record<string, unknown> | undefined
  const metadataPlan = typeof meta?.plan === "string" ? meta.plan : null
  const email = typeof user?.email === "string" ? user.email : ""
  const demoByEmail = email.length > 0 ? getDemoAccountByEmail(email) : undefined
  const isDemoUser = meta?.demo === true || demoByEmail !== undefined

  if (isDemoUser) {
    if (metadataPlan && isPlanCode(metadataPlan)) {
      return metadataPlan
    }
    if (demoByEmail && isPlanCode(demoByEmail.plan)) {
      return demoByEmail.plan
    }
  }

  if (clinicPlan && isPlanCode(clinicPlan)) {
    return clinicPlan
  }

  if (metadataPlan && isPlanCode(metadataPlan)) {
    return metadataPlan
  }

  return DEFAULT_PLAN
}
