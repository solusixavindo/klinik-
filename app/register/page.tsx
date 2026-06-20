"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PLANS, PlanCode } from "@/lib/billing"
import { DEMO_ACCOUNTS, getDemoAccountByPlan } from "@/lib/demoAccounts"
import { saveDemoSession } from "@/lib/demoSession"

type Mode = "register" | "demo"

const paidPlans: PlanCode[] = ["basic", "standard", "pro", "premium"]
const validPlans: PlanCode[] = ["trial", "basic", "standard", "pro", "premium"]

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <RegisterPageInner />
    </Suspense>
  )
}

function RegisterPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>("register")

  // Baca ?plan= dari URL dan pre-select paket
  const planFromUrl = searchParams.get("plan") as PlanCode | null
  const initialPlan: PlanCode = planFromUrl && validPlans.includes(planFromUrl) ? planFromUrl : "trial"

  // Form registrasi nyata
  const [form, setForm] = useState({ clinic_name: "", email: "", password: "", plan: initialPlan })

  // Sync plan jika URL berubah
  useEffect(() => {
    if (planFromUrl && validPlans.includes(planFromUrl)) {
      setForm(f => ({ ...f, plan: planFromUrl }))
    }
  }, [planFromUrl])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Demo
  const [selectedDemo, setSelectedDemo] = useState<PlanCode>("basic")

  const handleRegister = async () => {
    if (!form.clinic_name || !form.email || !form.password) {
      setError("Semua field wajib diisi")
      return
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter")
      return
    }

    try {
      setLoading(true)
      setError("")

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mendaftarkan klinik")
      }

      router.push(`/login?registered=1&email=${encodeURIComponent(data.email)}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    try {
      setLoading(true)
      setError("")

      const account = getDemoAccountByPlan(selectedDemo)
      if (!account) throw new Error("Paket demo tidak tersedia")

      saveDemoSession(account)
      router.push("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/20 mb-4">
            X
          </div>
          <h1 className="text-3xl font-bold text-white">XaviKlinika</h1>
          <p className="mt-2 text-slate-400">Platform Manajemen Klinik Modern</p>
        </div>

        {/* Tab Switch */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-2xl border border-slate-700/30 bg-slate-900/50 p-1">
            <button
              onClick={() => { setMode("register"); setError("") }}
              className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                mode === "register"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Daftar Klinik Baru
            </button>
            <button
              onClick={() => { setMode("demo"); setError("") }}
              className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                mode === "demo"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Coba Demo
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-auto mb-6 max-w-md rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ── MODE: REGISTER ── */}
        {mode === "register" && (
          <div className="mx-auto max-w-md">
            <div className="rounded-3xl border border-slate-700/30 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
              <h2 className="mb-1 text-xl font-bold text-white">Daftar Klinik Baru</h2>
              <p className="mb-6 text-sm text-slate-400">Trial gratis 14 hari, tidak perlu kartu kredit</p>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">Nama Klinik</label>
                  <input
                    type="text"
                    placeholder="Klinik Sehat Sejahtera"
                    value={form.clinic_name}
                    onChange={(e) => { setForm({ ...form, clinic_name: e.target.value }); setError("") }}
                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">Email Admin</label>
                  <input
                    type="email"
                    placeholder="admin@klinik.com"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setError("") }}
                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setError("") }}
                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-slate-500">Minimal 6 karakter</p>
                </div>

                {/* Pilih paket */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">Mulai dengan paket</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["trial", ...paidPlans] as PlanCode[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, plan: p })}
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                          form.plan === p
                            ? "border-indigo-500/60 bg-indigo-600/20 text-indigo-200"
                            : "border-slate-700/30 bg-slate-900/30 text-slate-400 hover:border-indigo-500/30"
                        }`}
                      >
                        <span className="block text-[10px] uppercase tracking-widest opacity-70">{PLANS[p].priceLabel}</span>
                        {PLANS[p].name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="btn-primary mt-8 w-full py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Mendaftarkan...
                  </span>
                ) : (
                  "Daftar Sekarang — Gratis 14 Hari"
                )}
              </button>

              <p className="mt-6 text-center text-sm text-slate-400">
                Sudah punya akun?{" "}
                <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
                  Login di sini
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ── MODE: DEMO ── */}
        {mode === "demo" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Pilih paket demo */}
            <div className="rounded-3xl border border-slate-700/30 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-6 shadow-2xl backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Akun Demo</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Pilih paket untuk dicoba</h2>
              <p className="mt-2 text-sm text-slate-400">
                Dashboard akan menampilkan menu sesuai fitur paket yang dipilih.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {DEMO_ACCOUNTS.map((account) => {
                  const plan = PLANS[account.plan]
                  const selected = selectedDemo === account.plan
                  return (
                    <button
                      key={account.plan}
                      type="button"
                      onClick={() => { setSelectedDemo(account.plan); setError("") }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-indigo-400/60 bg-indigo-600/15 shadow-lg shadow-indigo-600/10"
                          : "border-slate-700/30 bg-slate-900/30 hover:border-indigo-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Paket {plan.name}</p>
                        {selected && <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">Dipilih</span>}
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-white">{account.clinicName}</h3>
                      <p className="mt-1 text-xs text-slate-400">{plan.description}</p>
                      <div className="mt-3 rounded-xl bg-slate-950/40 p-3 text-xs text-slate-400">
                        <p>{account.email}</p>
                        <p className="text-slate-500">{account.password}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Panel aksi */}
            <div className="rounded-3xl border border-slate-700/30 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
              {(() => {
                const account = getDemoAccountByPlan(selectedDemo)
                const plan = PLANS[selectedDemo]
                if (!account) return null
                return (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Demo aktif</p>
                    <h3 className="mt-2 text-2xl font-bold text-white">Paket {plan.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{plan.priceLabel}</p>

                    <div className="mt-6 space-y-3 rounded-2xl border border-slate-700/20 bg-slate-900/40 p-4 text-sm">
                      <p className="text-slate-300"><span className="text-slate-500">Klinik:</span> {account.clinicName}</p>
                      <p className="text-slate-300"><span className="text-slate-500">Email:</span> {account.email}</p>
                      <p className="text-slate-300"><span className="text-slate-500">Password:</span> {account.password}</p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Fitur yang bisa dicoba:</p>
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                          <span className="text-emerald-400">✓</span> {f}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleDemo}
                      disabled={loading}
                      className="btn-primary mt-8 w-full py-3"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Menyiapkan...
                        </span>
                      ) : (
                        `Masuk Demo Paket ${plan.name}`
                      )}
                    </button>
                  </>
                )
              })()}

              <p className="mt-6 text-center text-sm text-slate-400">
                Mau daftar klinik sendiri?{" "}
                <button
                  onClick={() => { setMode("register"); setError("") }}
                  className="font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  Daftar di sini
                </button>
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-600">
          © 2026 Xavindo · Platform Manajemen Klinik Modern
        </div>
      </div>
    </div>
  )
}
