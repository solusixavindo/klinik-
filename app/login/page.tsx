"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PLANS } from "@/lib/billing"
import { DEMO_ACCOUNTS } from "@/lib/demoAccounts"
import { getMatchingDemoAccount, saveDemoSession } from "@/lib/demoSession"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return ""
    return new URLSearchParams(window.location.search).get("email") || ""
  })
  const [password, setPassword] = useState(() => {
    if (typeof window === "undefined") return ""
    return new URLSearchParams(window.location.search).get("password") || ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(() => {
    if (typeof window === "undefined") return ""
    return new URLSearchParams(window.location.search).get("registered")
      ? "Akun demo sudah siap. Klik Masuk Sekarang untuk membuka dashboard paket pilihan."
      : ""
  })

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Isi email dan password")
      return
    }

    try {
      setLoading(true)
      setError("")

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        const demoAccount = getMatchingDemoAccount(email, password)
        if (!demoAccount) throw signInError

        saveDemoSession(demoAccount)
        router.push("/")
        return
      }

      router.push("/")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat login"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email)
    setPassword(account.password)
    setError("")
    setSuccess(`Login demo Paket ${PLANS[account.plan].name} siap digunakan.`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[420px_1fr] lg:items-start">
        {/* Card */}
        <div className="rounded-3xl border border-slate-700/30 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <span className="text-2xl font-bold text-white">X</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Login Klinik</h1>
            <p className="text-slate-400">Kelola klinik Anda dengan platform premium</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/30 border border-red-700/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-2xl border border-emerald-700/30 bg-emerald-950/30 p-4 text-sm text-emerald-300">
              {success}
            </div>
          )}

          {/* Form */}
          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Email</label>
              <input
                type="email"
                placeholder="nama@klinik.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                onKeyPress={handleKeyPress}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError("")
                }}
                onKeyPress={handleKeyPress}
                className="input"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full mb-6 py-3"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Memproses...
              </span>
            ) : (
              "Masuk Sekarang"
            )}
          </button>

          {/* Register Link */}
          <p className="text-center text-slate-400 text-sm">
            Belum punya akun?{" "}
            <Link href="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
              Daftar di sini
            </Link>
          </p>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-slate-700/20">
            <p className="text-xs text-slate-500 text-center">
              Platform Manajemen Klinik Modern<br/>
              Dipercaya oleh klinik profesional di Indonesia
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-700/30 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-6 shadow-2xl backdrop-blur-xl lg:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Akun Demo Cepat</p>
          <h2 className="mt-3 text-2xl font-bold text-white">Masuk sesuai paket penawaran</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Pilih salah satu akun berikut untuk mengisi form login otomatis. Dashboard akan menampilkan menu sesuai fitur paket.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account)}
                className="rounded-2xl border border-slate-700/30 bg-slate-900/30 p-4 text-left transition hover:border-indigo-500/40 hover:bg-slate-800/40"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Paket {PLANS[account.plan].name}</p>
                <h3 className="mt-2 text-lg font-bold text-white">{account.clinicName}</h3>
                <p className="mt-2 text-sm text-slate-400">{account.email}</p>
                <p className="mt-1 text-sm text-slate-500">{account.password}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
