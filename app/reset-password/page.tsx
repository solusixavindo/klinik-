"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sets the session from the URL hash when user clicks reset link
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true)
      }
    })
  }, [])

  const handleReset = async () => {
    if (!password || password.length < 8) { setError("Password minimal 8 karakter"); return }
    if (password !== confirm) { setError("Konfirmasi password tidak cocok"); return }
    setLoading(true)
    setError("")
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => router.push("/login"), 2500)
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

          {done ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <h1 className="text-2xl font-bold text-white">Password Berhasil Diubah!</h1>
              <p className="text-slate-400 text-sm">Anda akan diarahkan ke halaman login...</p>
            </div>
          ) : !ready ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">⏳</div>
              <h1 className="text-2xl font-bold text-white">Memverifikasi Link...</h1>
              <p className="text-slate-400 text-sm">
                Jika halaman ini tidak berubah, link mungkin sudah kadaluarsa.{" "}
                <Link href="/forgot-password" className="text-indigo-400 hover:text-indigo-300">
                  Minta link baru
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Buat Password Baru</h1>
                <p className="text-slate-400 text-sm">Masukkan password baru untuk akun Anda.</p>
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-2xl bg-red-950/30 border border-red-700/30 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Password Baru</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError("") }}
                    placeholder="Minimal 8 karakter"
                    className="input w-full"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Konfirmasi Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError("") }}
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    placeholder="Ulangi password baru"
                    className="input w-full"
                  />
                </div>

                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </span>
                  ) : "Simpan Password Baru"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
