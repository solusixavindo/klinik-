"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { PLANS, type PlanCode } from "@/lib/billing"
import { toRegisterErrorMessage } from "@/lib/userFacingErrors"

const paidPlans: PlanCode[] = ["basic", "standard", "pro", "premium"]

const planHighlights: Record<string, string> = {
  basic:    "Data pasien & dokter · Jadwal dokter · Booking sederhana",
  standard: "Semua Basic + Antrian · Rekam Medis · BPJS",
  pro:      "Semua Standard + Kasir · Stok Obat · Laboratorium",
  premium:  "Semua Pro + Multi-cabang · Dashboard advanced",
}

type TrialForm = {
  clinicName: string
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
  const initialPlan = planFromUrl && paidPlans.includes(planFromUrl) ? planFromUrl : ""

  const [form, setForm] = useState<TrialForm>({
    clinicName: "",
    email: "",
    password: "",
    plan: initialPlan,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const updateForm = (patch: Partial<TrialForm>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setError("")
    setSuccess("")
  }

  const handleRegister = async () => {
    if (!form.clinicName.trim() || !form.email.trim() || !form.password) {
      setError("Nama klinik, email, dan password wajib diisi.")
      return
    }
    if (!form.plan) {
      setError("Pilih paket terlebih dahulu.")
      return
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.")
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName: form.clinicName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          plan: form.plan,
          package: form.plan,
        }),
      })
      const data = await res.json() as { success?: boolean; error?: string }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Pendaftaran belum berhasil. Mohon coba lagi.")
      }

      setSuccess("Akun berhasil dibuat, silakan login.")
      router.push(`/login?registered=1&email=${encodeURIComponent(form.email.trim().toLowerCase())}`)
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
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/20">
            X
          </div>
          <h1 className="text-3xl font-bold text-white">Mulai Trial Gratis 14 Hari</h1>
          <p className="mt-2 text-slate-400">Pilih paket, daftar, dan nikmati semua fitur gratis selama 14 hari. Tanpa kartu kredit.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,460px)_1fr] lg:items-start">
          {/* Form */}
          <section className="rounded-3xl border border-slate-700/30 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Daftar Sekarang</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Buat akun klinik Anda</h2>
              <p className="mt-2 text-sm text-slate-400">Tidak perlu kartu kredit. Aktif dalam 5 menit.</p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-5 rounded-2xl border border-emerald-700/30 bg-emerald-950/30 p-4 text-sm text-emerald-300">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Nama Klinik</label>
                <input
                  type="text"
                  placeholder="Nama klinik Anda"
                  value={form.clinicName}
                  onChange={(e) => updateForm({ clinicName: e.target.value })}
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
                <p className="mt-1 text-xs text-slate-500">Digunakan untuk login ke dashboard.</p>
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
                <label className="mb-2 block text-sm font-semibold text-slate-200">Pilih Paket</label>
                <select
                  value={form.plan}
                  onChange={(e) => updateForm({ plan: e.target.value as PlanCode | "" })}
                  className="input"
                >
                  <option value="">— Pilih paket Anda —</option>
                  {paidPlans.map((plan) => (
                    <option key={plan} value={plan}>
                      {PLANS[plan].name} — gratis 14 hari, lalu {PLANS[plan].priceLabel}
                    </option>
                  ))}
                </select>
                {form.plan && (
                  <p className="mt-2 text-xs text-indigo-300">✓ {planHighlights[form.plan]}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="btn-primary mt-7 w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Menyiapkan akun...
                </span>
              ) : (
                "Mulai Gratis 14 Hari →"
              )}
            </button>

            <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-500">
              <span>✓ Tanpa kartu kredit</span>
              <span>·</span>
              <span>✓ Batalkan kapan saja</span>
              <span>·</span>
              <span>✓ Data aman</span>
            </div>

            <p className="mt-5 text-center text-sm text-slate-400">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Login di sini
              </Link>
            </p>
          </section>

          {/* Right side — benefits */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-700/30 bg-slate-900/45 p-7 shadow-xl backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Kenapa XaviKlinika?</p>
              <h2 className="mt-2 text-xl font-bold text-white">Siap operasional sejak hari pertama</h2>

              <ul className="mt-6 space-y-4">
                {[
                  ["🏥", "Dashboard siap pakai", "Pantau pasien, antrian, dan pendapatan dalam satu layar."],
                  ["🔒", "Data klinik aman & terpisah", "Setiap klinik punya database sendiri yang terenkripsi."],
                  ["📦", "Fitur lengkap sesuai paket", "Dari booking sederhana sampai rekam medis & stok obat."],
                  ["🔔", "Reminder perpanjangan via WA", "Kami ingatkan 3 hari sebelum masa trial berakhir."],
                  ["⚡", "Aktif dalam 5 menit", "Daftar, login, langsung bisa digunakan."],
                ].map(([icon, title, desc]) => (
                  <li key={title as string} className="flex items-start gap-4">
                    <span className="mt-0.5 text-xl">{icon}</span>
                    <div>
                      <p className="font-semibold text-white">{title as string}</p>
                      <p className="mt-0.5 text-sm text-slate-400">{desc as string}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["5 menit", "Waktu setup"],
                ["0 rupiah", "14 hari pertama"],
                ["100%", "Data aman"],
              ].map(([val, label]) => (
                <div key={label as string} className="rounded-2xl border border-slate-700/30 bg-slate-900/40 p-4">
                  <p className="text-lg font-bold text-white">{val}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-emerald-700/20 bg-emerald-950/10 p-5">
              <p className="font-semibold text-white">🎉 14 Hari Pertama Gratis</p>
              <p className="mt-1 text-sm text-slate-400">
                Gunakan semua fitur paket pilihan Anda tanpa biaya. Di hari ke-11, kami ingatkan via WhatsApp sebelum masa trial berakhir.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
