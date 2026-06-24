"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { PLANS, type PlanCode } from "@/lib/billing"
import { toRegisterErrorMessage } from "@/lib/userFacingErrors"

const trialPlans: PlanCode[] = ["trial", "basic", "standard", "pro", "premium"]
const planLabel = (plan: PlanCode) => plan === "trial" ? "Trial 14 Hari" : PLANS[plan].name

type TrialForm = {
  clinic_name: string
  email: string
  password: string
  plan: PlanCode | ""
}

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
  const planFromUrl = searchParams.get("plan") as PlanCode | null
  const initialPlan = planFromUrl && trialPlans.includes(planFromUrl) ? planFromUrl : ""

  const [form, setForm] = useState<TrialForm>({
    clinic_name: "",
    email: "",
    password: "",
    plan: initialPlan,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const updateForm = (patch: Partial<TrialForm>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setError("")
  }

  const handleRegister = async () => {
    if (!form.clinic_name.trim() || !form.email.trim() || !form.password) {
      setError("Nama klinik, email, dan password wajib diisi.")
      return
    }

    if (!form.plan) {
      setError("Pilih paket trial terlebih dahulu.")
      return
    }

    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.")
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
      const data = await res.json() as { success?: boolean; error?: string; email?: string }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Pendaftaran belum berhasil. Mohon coba lagi.")
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })

      if (signInError) {
        router.push(`/login?registered=1&email=${encodeURIComponent(form.email.trim().toLowerCase())}`)
        return
      }

      router.push("/dashboard")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mendaftar."
      setError(toRegisterErrorMessage(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/20">
            X
          </div>
          <h1 className="text-3xl font-bold text-white">Mulai Trial Gratis 14 Hari</h1>
          <p className="mt-2 text-slate-400">Buat akun klinik Anda dan mulai kelola operasional secara digital.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,480px)_1fr] lg:items-start">
          <section className="rounded-3xl border border-slate-700/30 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Trial Gratis</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Daftarkan klinik Anda</h2>
              <p className="mt-2 text-sm text-slate-400">Tidak perlu kartu kredit. Setup cepat untuk mulai operasional digital.</p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Nama Klinik</label>
                <input
                  type="text"
                  placeholder="Nama klinik"
                  value={form.clinic_name}
                  onChange={(e) => updateForm({ clinic_name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Email Admin</label>
                <input
                  type="email"
                  placeholder="email@klinikanda.com"
                  value={form.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  className="input"
                />
                <p className="mt-1 text-xs text-slate-500">Gunakan email aktif untuk login ke dashboard.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Password</label>
                <input
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={form.password}
                  onChange={(e) => updateForm({ password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Paket Trial</label>
                <select
                  value={form.plan}
                  onChange={(e) => updateForm({ plan: e.target.value as PlanCode | "" })}
                  className="input"
                >
                  <option value="">Pilih paket trial</option>
                  {trialPlans.map((plan) => (
                    <option key={plan} value={plan}>
                      {planLabel(plan)} - {PLANS[plan].priceLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="btn-primary mt-8 w-full py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Menyiapkan trial...
                </span>
              ) : (
                "Mulai Trial Gratis 14 Hari"
              )}
            </button>

            <p className="mt-6 text-center text-sm text-slate-400">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Login di sini
              </Link>
            </p>
          </section>

          <aside className="rounded-3xl border border-slate-700/30 bg-slate-900/45 p-8 shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Mulai Lebih Rapi</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Trial siap untuk operasional klinik Anda</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <p><span className="text-emerald-400">✓</span> Dashboard siap digunakan untuk klinik Anda</p>
              <p><span className="text-emerald-400">✓</span> Data klinik tersimpan secara terpisah dan aman</p>
              <p><span className="text-emerald-400">✓</span> Pilih paket sesuai kebutuhan operasional</p>
              <p><span className="text-emerald-400">✓</span> Bisa upgrade kapan saja setelah trial</p>
            </div>

            <div className="mt-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5">
              <p className="font-semibold text-indigo-100">Ingin lihat fitur terlebih dahulu?</p>
              <p className="mt-2 text-sm text-slate-400">Jelajahi tampilan dashboard lengkap sebelum membuat akun trial.</p>
              <Link href="/demo" className="btn-secondary mt-4 w-full">
                Coba Demo Interaktif
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
