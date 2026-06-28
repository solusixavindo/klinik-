"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { clearDemoSession } from "@/lib/demoSession"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  const [success] = useState(() => {
    if (typeof window === "undefined") return ""
    return new URLSearchParams(window.location.search).get("registered")
      ? "Akun berhasil dibuat. Silakan masuk untuk membuka dashboard klinik Anda."
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

      if (signInError) throw signInError

      clearDemoSession()
      router.push("/dashboard")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto grid w-full max-w-3xl gap-6">
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-200">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                  Lupa password?
                </Link>
              </div>
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

      </div>
    </div>
  )
}
