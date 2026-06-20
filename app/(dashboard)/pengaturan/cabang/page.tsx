"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

type Branch = {
  id: string
  clinic_id: string
  name: string
  address: string | null
  phone: string | null
  pic_name: string | null
  is_active: boolean
  created_at: string
}

type ClinicInfo = {
  name: string
  address: string | null
  phone: string | null
  plan: string
}

const emptyForm = { name: "", address: "", phone: "", pic_name: "" }

export default function ManajemenCabangPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [clinic, setClinic] = useState<ClinicInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const [branchRes, settingsRes] = await Promise.all([
        fetch("/api/branches", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/pengaturan", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const branchData = await branchRes.json()
      const settingsData = await settingsRes.json()

      if (!branchRes.ok && branchData.error !== "Fitur Multi-Cabang hanya tersedia di paket Premium") {
        if (!branchRes.ok) throw new Error(branchData.error)
      }

      if (settingsData.success) {
        const c = settingsData.clinic
        setClinic({ name: c.name, address: c.address, phone: c.phone, plan: c.plan })
        setIsPremium(c.plan === "premium")
      }

      if (branchData.success) {
        setBranches(branchData.branches ?? [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Nama cabang wajib diisi"); return }
    setSaving(true)
    setError("")
    try {
      const token = await getToken()
      const method = editId ? "PATCH" : "POST"
      const body = editId ? { id: editId, ...form } : { ...form }
      const res = await fetch("/api/branches", {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setShowForm(false)
      setForm(emptyForm)
      setEditId(null)
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan cabang")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (branch: Branch) => {
    setForm({
      name: branch.name,
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      pic_name: branch.pic_name ?? "",
    })
    setEditId(branch.id)
    setShowForm(true)
    setError("")
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm("Nonaktifkan cabang ini?")) return
    const token = await getToken()
    const res = await fetch(`/api/branches?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.success) load()
    else setError(data.error)
  }

  const handleActivate = async (id: string) => {
    const token = await getToken()
    const res = await fetch("/api/branches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, is_active: true }),
    })
    const data = await res.json()
    if (data.success) load()
    else setError(data.error)
  }

  const f = (v: string, k: string) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            <Link href="/pengaturan" className="hover:text-indigo-300">Pengaturan</Link>
            {" / "}Manajemen Cabang
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Manajemen Cabang</h1>
        </div>
        {isPremium && (
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setError("") }}
            className="btn-primary text-sm"
          >
            + Tambah Cabang
          </button>
        )}
      </div>

      {/* Premium gate */}
      {!loading && !isPremium && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-950/20 p-8 text-center space-y-4">
          <p className="text-3xl">🏢</p>
          <h2 className="text-xl font-bold text-white">Fitur Multi-Cabang</h2>
          <p className="text-slate-300 max-w-md mx-auto">
            Kelola beberapa cabang klinik dalam satu dashboard terpadu. Atur data pasien, dokter,
            dan booking per cabang secara terpisah. Fitur ini hanya tersedia di paket <strong>Premium</strong>.
          </p>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>✓ Manajemen cabang tak terbatas</li>
            <li>✓ Data terisolasi per cabang</li>
            <li>✓ Switch cabang dari navbar</li>
            <li>✓ Laporan per cabang</li>
          </ul>
          <Link
            href="/billing"
            className="inline-block mt-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            Upgrade ke Premium
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>
      )}

      {/* Form tambah/edit */}
      {showForm && isPremium && (
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">{editId ? "Edit Cabang" : "Tambah Cabang Baru"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Nama Cabang <span className="text-red-400">*</span></label>
              <input type="text" value={form.name} onChange={(e) => f(e.target.value, "name")} className="input" placeholder="Cabang Utara" />
            </div>
            <div>
              <label className="label">Nama PIC (Person in Charge)</label>
              <input type="text" value={form.pic_name} onChange={(e) => f(e.target.value, "pic_name")} className="input" placeholder="Nama penanggung jawab..." />
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
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      {/* Cabang Utama */}
      {!loading && clinic && (
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
          <div className="border-b border-slate-700/20 p-5">
            <h2 className="font-semibold text-white">Daftar Cabang</h2>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
          ) : (
            <div className="divide-y divide-slate-700/20">
              {/* Cabang Utama (parent clinic) */}
              <div className="flex items-center justify-between p-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{clinic.name}</p>
                    <span className="rounded-full border border-indigo-500/40 bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                      Cabang Utama
                    </span>
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                      Aktif
                    </span>
                  </div>
                  {clinic.address && <p className="text-sm text-slate-400">{clinic.address}</p>}
                  {clinic.phone && <p className="text-sm text-slate-500">{clinic.phone}</p>}
                </div>
              </div>

              {/* Cabang tambahan */}
              {branches.map((branch) => (
                <div key={branch.id} className="flex items-center justify-between p-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{branch.name}</p>
                      {branch.is_active ? (
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">Aktif</span>
                      ) : (
                        <span className="rounded-full border border-slate-600/40 bg-slate-700/20 px-2 py-0.5 text-xs text-slate-500">Nonaktif</span>
                      )}
                    </div>
                    {branch.address && <p className="text-sm text-slate-400">{branch.address}</p>}
                    <div className="flex gap-4 text-xs text-slate-500">
                      {branch.phone && <span>{branch.phone}</span>}
                      {branch.pic_name && <span>PIC: {branch.pic_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(branch)}
                      className="rounded-lg border border-slate-600/30 bg-slate-700/30 px-3 py-1 text-xs text-slate-300 hover:bg-slate-600/40"
                    >
                      Edit
                    </button>
                    {branch.is_active ? (
                      <button
                        onClick={() => handleDeactivate(branch.id)}
                        className="rounded-lg border border-amber-700/30 bg-amber-950/30 px-3 py-1 text-xs text-amber-300 hover:bg-amber-900/40"
                      >
                        Nonaktifkan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(branch.id)}
                        className="rounded-lg border border-emerald-700/30 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-900/40"
                      >
                        Aktifkan
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isPremium && branches.length === 0 && (
                <div className="flex h-24 items-center justify-center text-slate-500 text-sm">
                  Belum ada cabang tambahan. Klik &quot;+ Tambah Cabang&quot; untuk menambah.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
