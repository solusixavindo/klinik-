/* eslint-disable @next/next/no-img-element */
"use client"

import { Toaster } from "sonner"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { dashboardMenuGroups, primaryMenu } from "@/lib/dashboardMenu"
import { supabase } from "@/lib/supabase"
import {
  hasPlanFeature,
  PlanFeature,
  Plan,
  PLANS,
  DEFAULT_PLAN,
  isPlanCode,
  type PlanCode,
} from "@/lib/billing"

type Subscription = {
  plan: Plan
  status: string
  days_remaining?: number
  is_active?: boolean
}

type ClinicInfo = {
  name: string
  logo_url: string | null
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark"
    return localStorage.getItem("xaviklinika-theme") === "light" ? "light" : "dark"
  })
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null)

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    let mounted = true
    const gate = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (!data.session) {
        router.replace("/login")
        setAuthenticated(false)
        return
      }
      setAuthenticated(true)
    }
    gate()
    const { data: gateListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login")
        setAuthenticated(false)
        return
      }
      setAuthenticated(true)
    })
    return () => {
      mounted = false
      gateListener?.subscription?.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (authenticated !== true) return
    let mounted = true
    const fetchSubscription = async (token?: string) => {
      if (!mounted) return
      setSubscriptionLoading(true)
      setSubscriptionError(null)

      const accessToken = token || (await supabase.auth.getSession()).data.session?.access_token
      if (!accessToken) {
        setSubscriptionLoading(false)
        setSubscription(null)
        return
      }

      try {
        const res = await fetch("/api/subscription", {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        })
        const text = await res.text()
        let result: {
          success?: boolean
          subscription?: Subscription
          error?: string
          code?: string
          hint?: string
        } = {}
        try {
          result = text ? (JSON.parse(text) as typeof result) : {}
        } catch {
          setSubscriptionError("Respons server tidak valid (bukan JSON). Cek deploy / proxy.")
          setSubscription(null)
          return
        }
        if (res.ok && result.success && result.subscription) {
          setSubscription(result.subscription)
        } else if (res.status === 503 && result.code === "SERVICE_ROLE_INVALID") {
          const { data: userData } = await supabase.auth.getUser()
          const user = userData.user
          if (user) {
            const meta = user.user_metadata as Record<string, unknown>
            let code: PlanCode = DEFAULT_PLAN
            const mp = typeof meta.plan === "string" ? meta.plan : null
            if (mp && isPlanCode(mp)) {
              code = mp
            }
            const plan = PLANS[code]
            setSubscription({
              plan,
              status: "active",
              is_active: true,
              days_remaining: 0,
            })
            setSubscriptionError(null)
          } else {
            setSubscriptionError(result.error || "Service role tidak dikonfigurasi di server")
            setSubscription(null)
          }
        } else {
          let errMsg = result.error || `Gagal mengambil data langganan (${res.status})`
          if (typeof result.hint === "string") errMsg += ` — ${result.hint}`
          setSubscriptionError(errMsg)
          setSubscription(null)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Gagal mengambil data langganan"
        setSubscriptionError(message)
        setSubscription(null)
      } finally {
        if (mounted) setSubscriptionLoading(false)
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        fetchSubscription(session.access_token)
      }
    })

    fetchSubscription()

    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [authenticated])

  useEffect(() => {
    if (authenticated !== true) return
    const fetchClinicInfo = async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) return
      try {
        const res = await fetch("/api/pengaturan", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        const data = await res.json() as { success?: boolean; clinic?: { name: string; logo_url?: string | null } }
        if (data.success && data.clinic) {
          setClinicInfo({ name: data.clinic.name, logo_url: data.clinic.logo_url ?? null })
        }
      } catch {
        // silently fail — clinic info is optional display
      }
    }
    fetchClinicInfo()
    window.addEventListener("xaviklinika:clinic-updated", fetchClinicInfo)
    return () => window.removeEventListener("xaviklinika:clinic-updated", fetchClinicInfo)
  }, [authenticated, pathname])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    localStorage.setItem("xaviklinika-theme", nextTheme)
    document.documentElement.dataset.theme = nextTheme
  }

  const hasFeature = (feature?: PlanFeature) => {
    if (!feature) return true
    if (subscriptionLoading) return true
    return hasPlanFeature(subscription?.plan.code, feature)
  }

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Memuat sesi...
      </div>
    )
  }

  if (authenticated === false) {
    return null
  }

  return (
    <div className="theme-shell min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <Toaster richColors closeButton position="bottom-right" theme="dark" />
      {/* Header Mobile */}
      <div className="theme-mobile-header lg:hidden sticky top-0 z-40 border-b border-slate-700/20 bg-slate-900/60 backdrop-blur-xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {clinicInfo?.logo_url ? (
              <img src={clinicInfo.logo_url} alt={clinicInfo.name} className="h-10 w-10 rounded-2xl object-cover border border-slate-700/40" />
            ) : (
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white">
                {(clinicInfo?.name || "X").trim().slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-slate-100">{clinicInfo?.name || "XaviKlinika"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="theme-toggle p-2 rounded-xl" aria-label="Ganti tema">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 hover:bg-slate-800/50 rounded-xl">
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="theme-mobile-header lg:hidden absolute top-16 left-0 right-0 z-30 border-b border-slate-700/20 bg-slate-900/90 backdrop-blur-xl p-4">
          <nav className="max-h-[calc(100vh-96px)] space-y-4 overflow-y-auto pr-1">
            {primaryMenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setIsMobileOpen(false)
                }}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            {dashboardMenuGroups.map((group) => (
              <div key={group.title}>
                <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    hasFeature(item.requiredFeature) && (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                          isActive(item.href)
                            ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                            : "text-slate-300 hover:bg-slate-800/50"
                        }`}
                    >
                      <span className="w-5 text-center text-base text-indigo-300">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                    )
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Main Layout */}
      <div className="mx-auto max-w-[1920px] px-4 py-6 lg:px-8 lg:py-8">
        <div className="grid min-h-[calc(100vh-100px)] gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="theme-sidebar hidden lg:flex max-h-[calc(100vh-64px)] flex-col rounded-3xl border border-slate-700/20 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-xl p-6 shadow-lg sticky top-8">
            <div className="flex items-start gap-3 pb-6 border-b border-slate-700/20 mb-8">
              {clinicInfo?.logo_url ? (
                <img src={clinicInfo.logo_url} alt={clinicInfo.name} className="h-14 w-14 rounded-2xl object-cover border border-slate-700/40 shrink-0" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-600/20">
                  <span className="text-xl font-bold text-white">
                    {(clinicInfo?.name || "X").trim().slice(0, 1).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
                  {clinicInfo?.name || "XaviKlinika"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold text-white">{clinicInfo?.name || subscription?.plan.name || "XaviKlinika"}</h1>
                  {subscription?.plan.name && (
                    <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                      {subscription.plan.name}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {subscriptionLoading
                    ? "Memuat status langganan..."
                    : subscription
                      ? subscription.status === "active"
                        ? subscription.is_active
                          ? "Langganan aktif, akses penuh tersedia"
                          : "Langganan aktif tapi perlu verifikasi"
                        : subscription.status === "trialing"
                          ? `Trial aktif, tersisa ${subscription.days_remaining ?? 0} hari`
                          : "Akses terbatas. Upgrade untuk fitur lengkap"
                      : subscriptionError
                        ? "Gagal memuat langganan. Silakan refresh."
                        : "Akses terbatas. Upgrade untuk fitur lengkap"}
                </p>
              </div>
            </div>

            <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
              {primaryMenu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-600/10"
                      : "text-slate-300 hover:bg-slate-800/30 hover:text-slate-100"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive(item.href) && (
                    <div className="ml-auto w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                  )}
                </Link>
              ))}
              {dashboardMenuGroups.map((group) => (
                <div key={group.title}>
                  <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    {group.title}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      hasFeature(item.requiredFeature) && (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                            isActive(item.href)
                              ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-600/10"
                              : "text-slate-300 hover:bg-slate-800/30 hover:text-slate-100"
                          }`}
                        >
                          <span className="w-5 text-center text-base text-indigo-300">{item.icon}</span>
                          <span className="leading-snug">{item.label}</span>
                          {isActive(item.href) && (
                            <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400"></div>
                          )}
                        </Link>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-6 border-t border-slate-700/20 pt-6">
              <button
                onClick={toggleTheme}
                className="theme-toggle mb-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                {theme === "dark" ? "☀️ Tema Terang" : "🌙 Tema Gelap"}
              </button>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                © 2026 Xavindo
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <main className="theme-main rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl p-6 lg:p-8 shadow-lg min-h-full">
            {/* Header Section */}
            <div className="theme-hero mb-8 rounded-2xl border border-slate-700/20 bg-gradient-to-r from-indigo-950/30 to-slate-900/30 backdrop-blur-sm p-6 shadow-md">
              <div>
                <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-2">
                  Platform Manajemen
                </p>
                <h2 className="text-2xl lg:text-3xl font-bold text-white">
                  Selamat datang di dashboard
                </h2>
              </div>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
