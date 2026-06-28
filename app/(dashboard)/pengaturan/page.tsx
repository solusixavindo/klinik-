/* eslint-disable @next/next/no-img-element */
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
  logo_url: string | null
  online_booking_enabled: boolean
  plan: string
  subscription_status: string
  trial_ends_at: string | null
  current_period_end: string | null
  bank_name: string | null
  bank_account: string | null
  bank_holder: string | null
}

export default function PengaturanPage() {
  const [clinic, setClinic] = useState<ClinicSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", bank_name: "", bank_account: "", bank_holder: "" })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)

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
        bank_name: data.clinic.bank_name ?? "",
        bank_account: data.clinic.bank_account ?? "",
        bank_holder: data.clinic.bank_holder ?? "",
      })
      setLogoPreview(data.clinic.logo_url ?? "")
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
      window.dispatchEvent(new CustomEvent("xaviklinika:clinic-updated"))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan pengaturan")
    } finally {
      setSaving(false)
    }
  }

  const handleLogoChange = (file?: File) => {
    setError("")
    setSuccess("")
    if (!file) {
      setLogoFile(null)
      setLogoPreview(clinic?.logo_url ?? "")
      return
    }

    const allowed = ["image/png", "image/jpeg", "image/webp"]
    if (!allowed.includes(file.type)) {
      setError("Format logo harus png, jpg, jpeg, atau webp.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran logo maksimal 2MB.")
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleUploadLogo = async () => {
    if (!logoFile) {
      setError("Pilih file logo terlebih dahulu.")
      return
    }

    setUploadingLogo(true)
    setError("")
    setSuccess("")

    try {
      const token = await getToken()
      if (!token) throw new Error("Sesi login tidak valid. Silakan login ulang.")

      const body = new FormData()
      body.append("logo", logoFile)

      const res = await fetch("/api/clinic-logo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Gagal upload logo")

      setClinic((current) => current ? { ...current, logo_url: data.clinic.logo_url } : current)
      setLogoPreview(data.clinic.logo_url)
      setLogoFile(null)
      setSuccess("Logo klinik berhasil diperbarui.")
      window.dispatchEvent(new CustomEvent("xaviklinika:clinic-updated"))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal upload logo klinik")
    } finally {
      setUploadingLogo(false)
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
          <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 space-y-4">
            <h2 className="font-semibold text-white">Informasi Klinik</h2>
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/20 bg-slate-900/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt={form.name || "Logo klinik"} className="h-20 w-20 rounded-2xl border border-slate-700/40 object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-2xl font-bold text-white">
                    {(form.name || "K").trim().slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">Logo Klinik</p>
                  <p className="mt-1 text-xs text-slate-400">PNG, JPG, JPEG, atau WEBP. Maksimal 2MB.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleLogoChange(e.target.files?.[0])}
                  className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                <button onClick={handleUploadLogo} disabled={uploadingLogo || !logoFile} className="btn-secondary text-sm">
                  {uploadingLogo ? "Mengupload..." : "Upload Logo"}
                </button>
              </div>
            </div>
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
            {/* Bank info */}
            <div className="pt-2 border-t border-slate-700/20">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Informasi Rekening Bank (untuk Invoice)</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="label">Nama Bank</label>
                  <select value={form.bank_name} onChange={(e) => f(e.target.value, "bank_name")} className="input">
                    <option value="">-- Pilih Bank --</option>
                    <option>Bank BCA</option>
                    <option>Bank BRI</option>
                    <option>Bank BNI</option>
                    <option>Bank Mandiri</option>
                    <option>Bank BTN</option>
                    <option>Bank CIMB Niaga</option>
                    <option>Bank Danamon</option>
                    <option>Bank Permata</option>
                    <option>Bank Panin</option>
                    <option>Bank OCBC NISP</option>
                    <option>Bank Maybank</option>
                    <option>Bank HSBC</option>
                    <option>Bank Standard Chartered</option>
                    <option>Bank Citibank</option>
                    <option>Bank DBS</option>
                    <option>Bank Mega</option>
                    <option>Bank Bukopin</option>
                    <option>Bank Sinarmas</option>
                    <option>Bank Commonwealth</option>
                    <option>Bank UOB</option>
                    <option>Bank Muamalat</option>
                    <option>Bank Syariah Indonesia (BSI)</option>
                    <option>Bank BRI Syariah</option>
                    <option>Bank BNI Syariah</option>
                    <option>Bank Mandiri Syariah</option>
                    <option>Bank Neo Commerce</option>
                    <option>Bank Jago</option>
                    <option>SeaBank</option>
                    <option>Allo Bank</option>
                    <option>Bank Raya</option>
                    <option>Bank Sahabat Sampoerna</option>
                    <option>Bank Aceh Syariah</option>
                    <option>Bank BJB</option>
                    <option>Bank DKI</option>
                    <option>Bank Jatim</option>
                    <option>Bank Jateng</option>
                    <option>Bank Sumut</option>
                    <option>Bank Sumsel Babel</option>
                    <option>Bank BPD Bali</option>
                    <option>Bank Kalsel</option>
                    <option>Bank Sulselbar</option>
                  </select>
                </div>
                <div>
                  <label className="label">Nomor Rekening</label>
                  <input type="text" value={form.bank_account} onChange={(e) => f(e.target.value, "bank_account")} className="input" placeholder="800211236800" />
                </div>
                <div>
                  <label className="label">Atas Nama</label>
                  <input type="text" value={form.bank_holder} onChange={(e) => f(e.target.value, "bank_holder")} className="input" placeholder="Nama pemilik rekening" />
                </div>
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
