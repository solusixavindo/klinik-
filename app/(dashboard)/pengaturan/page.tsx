"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getPlan } from "@/lib/billing"

type ClinicSettings = {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  slug: string | null
  online_booking_enabled: boolean
  plan: string
  subscription_status: string
  trial_ends_at: string | null
  current_period_end: string | null
}

export default function PengaturanPage() {
  const [clinic, setClinic] = useState<ClinicSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" })

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/pengaturan", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setClinic(data.clinic)
      setForm({
        name: data.clinic.name ?? "",
        address: data.clinic.address ?? "",
        phone: data.clinic.phone ?? "",
        email: data.clinic.email ?? "",
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat pengaturan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Nama klinik wajib diisi"); return }
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const token = await getToken()
      const res = await fetch("/api/pengaturan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setClinic(data.clinic)
      setSuccess("Pengaturan berhasil disimpan.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan pengaturan")
    } finally {
      setSaving(false)
    }
  }

  const f = (v: string, k: string) => setForm((p) => ({ ...p, [k]: v }))
  const planInfo = clinic ? getPlan(clinic.plan) : null

  const formatDate = (d: string | null) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pengaturan</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Pengaturan Klinik</h1>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-700/30 bg-emerald-950/30 p-4 text-sm text-emerald-300">{success}</div>}

      {loading ? (
        <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat pengaturan...</div>
      ) : (
        <>
          {/* Form Pengaturan Dasar */}
          <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 space-y-4">
            <h2 className="font-semibold text-white">Informasi Klinik</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Nama Klinik <span className="text-red-400">*</span></label>
                <input type="text" value={form.name} onChange={(e) => f(e.target.value, "name")} className="input" placeholder="Nama klinik..." />
              </div>
              <div>
                <label className="label">Email Kontak</label>
                <input type="email" value={form.email} onChange={(e) => f(e.target.value, "email")} className="input" placeholder="email@klinik.com" />
              </div>
              <div>
                <label className="label">Telepon</label>
                <input type="text" value={form.phone} onChange={(e) => f(e.target.value, "phone")} className="input" placeholder="021-xxxxxxxx" />
              </div>
              <div>
                <label className="label">Alamat</label>
                <input type="text" value={form.address} onChange={(e) => f(e.target.value, "address")} className="input" placeholder="Jl. ..." />
              </div>
            </div>
            {clinic?.slug && (
              <div>
                <label className="label">Slug Booking Online</label>
                <p className="text-sm text-slate-400 mt-1">
                  <code className="rounded bg-slate-800/60 px-2 py-0.5 text-slate-300">/booking/{clinic.slug}</code>
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>

          {/* Info Plan */}
          {planInfo && clinic && (
            <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 space-y-3">
              <h2 className="font-semibold text-white">Paket Saat Ini</h2>
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <p className="text-2xl font-bold text-indigo-300">{planInfo.name}</p>
                  <p className="text-sm text-slate-400">{planInfo.priceLabel}</p>
                </div>
                <div className="text-sm text-slate-400 space-y-1">
                  <p>Status: <span className="capitalize text-slate-300">{clinic.subscription_status}</span></p>
                  {clinic.trial_ends_at && clinic.subscription_status === "trialing" && (
                    <p>Trial berakhir: <span className="text-amber-300">{formatDate(clinic.trial_ends_at)}</span></p>
                  )}
                  {clinic.current_period_end && clinic.subscription_status !== "trialing" && (
                    <p>Berlaku hingga: <span className="text-slate-300">{formatDate(clinic.current_period_end)}</span></p>
                  )}
                </div>
              </div>
              <Link href="/billing" className="inline-block text-sm text-indigo-400 hover:text-indigo-300">
                Kelola paket & langganan →
              </Link>
            </div>
          )}

          {/* Sub-halaman */}
          <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 space-y-3">
            <h2 className="font-semibold text-white">Pengaturan Lanjutan</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/pengaturan/cabang"
                className="flex items-center gap-3 rounded-2xl border border-slate-700/30 bg-slate-800/30 p-4 hover:bg-slate-700/40 transition-colors"
              >
                <span className="text-2xl">🏢</span>
                <div>
                  <p className="font-medium text-white text-sm">Manajemen Cabang</p>
                  <p className="text-xs text-slate-400">Kelola cabang klinik (Premium)</p>
                </div>
              </Link>
              <Link
                href="/pengaturan/booking-online"
                className="flex items-center gap-3 rounded-2xl border border-slate-700/30 bg-slate-800/30 p-4 hover:bg-slate-700/40 transition-colors"
              >
                <span className="text-2xl">🔗</span>
                <div>
                  <p className="font-medium text-white text-sm">Booking Online</p>
                  <p className="text-xs text-slate-400">Link booking publik untuk pasien</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
