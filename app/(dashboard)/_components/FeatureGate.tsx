"use client"

import { PlanCode, PlanFeature, hasPlanFeature } from "@/lib/billing"

type FeatureGateProps = {
  feature: PlanFeature
  planCode?: PlanCode
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Component untuk show/hide content based on plan feature
 */
export function FeatureGate({ feature, planCode, children, fallback }: FeatureGateProps) {
  const hasAccess = hasPlanFeature(planCode, feature)

  if (!hasAccess) {
    return fallback ?? null
  }

  return <>{children}</>
}

type LockedFeatureProps = {
  featureName: string
  requiredPlan: string
}

/**
 * Component untuk menampilkan pesan fitur terkunci
 */
export function LockedFeature({ featureName, requiredPlan }: LockedFeatureProps) {
  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-950/20 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13 16a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-100">{featureName}</h3>
          <p className="mt-1 text-sm text-yellow-200">Fitur ini hanya tersedia di paket {requiredPlan}.</p>
          <a href="/billing" className="mt-3 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Lihat Paket Upgrade →
          </a>
        </div>
      </div>
    </div>
  )
}
