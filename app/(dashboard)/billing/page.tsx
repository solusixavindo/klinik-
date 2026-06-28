"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { PLANS, PlanCode } from "@/lib/billing"
import { toast } from "sonner"

type SubscriptionResponse = {
  success?: boolean
  error?: string
  subscription?: {
    plan: {
      code: PlanCode
      name: string
      priceLabel: string
    }
    status: string
    days_remaining: number
    is_active: boolean
    current_period_end?: string | null
  }
}

type CheckoutResponse = {
  success?: boolean
  error?: string
  redirect_url?: string
}

const planOrder: PlanCode[] = ["basic", "standard", "pro", "premium"]

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionResponse["subscription"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutPlan, setCheckoutPlan] = useState<PlanCode | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      if (!token) {
        setLoading(false)
        return
      }

      const res = await fetch("/api/subscription", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = (await res.json()) as SubscriptionResponse

      if (res.ok && result.success && result.subscription) {
        setSubscription(result.subscription)
      } else {
        toast.error(result.error || "Gagal mengambil data paket")
      }

      setLoading(false)
    }

    fetchSubscription()
  }, [])

  const checkout = async (plan: PlanCode) => {
    // For premium plan, redirect to WhatsApp
    if (plan === "premium") {
      window.open("https://wa.me/628139536886?text=Halo,%20saya%20ingin%20konsultasi%20tentang%20paket%20Premium%20untuk%20klinik%20saya", "_blank")
      return
    }

    setCheckoutPlan(plan)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      if (!token) {
        toast.error("Sesi login tidak ditemukan. Silakan login ulang.")
        return
      }

      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      })
      const result = (await res.json()) as CheckoutResponse

      if (!res.ok || !result.success || !result.redirect_url) {
        toast.error(result.error || "Gagal membuat pembayaran paket")
        return
      }

      window.location.assign(result.redirect_url)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat pembayaran paket"
      toast.error(message)
    } finally {
      setCheckoutPlan(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading paket langganan...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Langganan</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Paket & Langganan</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Pilih atau upgrade paket sesuai kebutuhan klinik Anda. Semua paket baru mendapatkan 14 hari gratis.
          </p>
        </div>

        {subscription && (
          <div className="rounded-2xl border border-slate-700/20 bg-slate-900/30 px-5 py-4">
            <p className="text-xs text-slate-500">Paket aktif</p>
            <p className="mt-1 text-lg font-bold text-white">{subscription.plan.name}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {planOrder.map((code) => {
          const plan = PLANS[code]
          const isCurrent = subscription?.plan.code === code
          const isPopular = code === "pro"

          return (
            <div
              key={plan.code}
              className={`relative rounded-3xl border p-6 shadow-md ${
                isPopular
                  ? "border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 to-slate-900/30"
                  : "border-slate-700/20 bg-gradient-to-br from-slate-800/35 to-slate-900/25"
              }`}
            >
              {plan.code === "premium" && (
                <span className="absolute left-5 top-5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Growth & Multi Cabang
                </span>
              )}
              {isPopular && (
                <span className="badge badge-primary absolute right-5 top-5">
                  Rekomendasi
                </span>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
                <p className="mt-5 text-3xl font-bold text-white">{plan.priceLabel}</p>
                <p className="mt-2 text-sm text-slate-400">{plan.setupPriceLabel}</p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <Limit label="Pasien" value={plan.limits.patients} />
                <Limit label="Dokter" value={plan.limits.doctors} />
                <Limit label="Staff" value={plan.limits.staff} />
                <Limit label="Booking/bln" value={plan.limits.bookingsPerMonth} />
              </div>

              <div className="mb-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-300">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <button className="btn-secondary w-full" disabled>
                  Paket Aktif
                </button>
              ) : (
                <button
                  onClick={() => checkout(code)}
                  disabled={checkoutPlan === code}
                  className="btn-primary w-full"
                >
                  {checkoutPlan === code ? "Membuat Checkout..." : code === "premium" ? "Konsultasi WhatsApp" : "Upgrade Paket"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 shadow-md">
        <h2 className="text-lg font-bold text-white">Informasi Pembayaran</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Setelah pembayaran berhasil, paket Anda diaktifkan secara otomatis dalam hitungan menit. Konfirmasi akan dikirim ke email yang terdaftar.
          Untuk pertanyaan atau kendala pembayaran, hubungi tim kami melalui WhatsApp.
        </p>
      </div>
    </div>
  )
}

function Limit({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-700/20 bg-slate-900/30 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-white">{value.toLocaleString("id-ID")}</p>
    </div>
  )
}
