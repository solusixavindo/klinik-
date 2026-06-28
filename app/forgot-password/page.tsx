"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSend = async () => {
    if (!email.trim()) { setError("Masukkan alamat email Anda"); return }
    setLoading(true)
    setError("")
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-700/30 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <span className="text-2xl font-bold text-white">X</span>
            </div>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <h1 className="text-2xl font-bold text-white">Email Terkirim!</h1>
              <p className="text-slate-400 text-sm">
                Link reset password telah dikirim ke <span className="text-white font-medium">{email}</span>.
                Cek inbox (dan folder spam) Anda.
              </p>
              <Link href="/login" className="inline-block mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition">
                ← Kembali ke halaman login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Lupa Password</h1>
                <p className="text-slate-400 text-sm">Masukkan email Anda dan kami akan mengirim link reset password.</p>
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-2xl bg-red-950/30 border border-red-700/30 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError("") }}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="nama@klinik.com"
                    className="input w-full"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengirim...
                    </span>
                  ) : "Kirim Link Reset Password"}
                </button>

                <p className="text-center text-slate-400 text-sm">
                  Ingat password?{" "}
                  <Link href="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
                    Login di sini
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
