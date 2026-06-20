"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"

type BpjsReg = {
  id: string
  bpjs_number: string
  patient_name: string
  poli: string
  referral_number: string | null
  visit_date: string
  status: string
  notes: string | null
}

const POLI_LIST = ["Poli Umum", "Poli Gigi", "Poli Anak", "Poli Kandungan", "Poli Mata", "Poli THT", "Poli Kulit", "Poli Dalam", "Poli Bedah", "Poli Saraf"]
const STATUS_MAP: Record<string, string> = {
  registered: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  called: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  done: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
}
const STATUS_LABEL: Record<string, string> = { registered: "Terdaftar", called: "Dipanggil", done: "Selesai", cancelled: "Batal" }

const emptyForm = { bpjs_number: "", patient_name: "", poli: "Poli Umum", referral_number: "", notes: "" }

export default function BpjsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [registrations, setRegistrations] = useState<BpjsReg[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  const load = useCallback(async (d: string) => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch(`/api/bpjs?date=${d}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setRegistrations(data.registrations)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(date) }, [date, load])

  const handleSave = async () => {
    if (!form.bpjs_number || !form.patient_name || !form.poli) {
      setError("No. BPJS, nama, dan poli wajib diisi")
      return
    }
    setSaving(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/bpjs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, visit_date: date }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setShowForm(false)
      setForm(emptyForm)
      load(date)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mendaftarkan")
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const token = await getToken()
    await fetch("/api/bpjs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    })
    load(date)
  }

  const f = (v: string, k: string) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pendaftaran</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Pendaftaran BPJS</h1>
        </div>
        <div className="flex gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-auto" />
          <button onClick={() => { setShowForm(true); setError("") }} className="btn-primary text-sm">+ Daftar BPJS</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      {showForm && (
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Pendaftaran Pasien BPJS</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">No. Kartu BPJS</label>
              <input type="text" value={form.bpjs_number} onChange={(e) => f(e.target.value, "bpjs_number")} className="input" placeholder="0001234567890" />
            </div>
            <div>
              <label className="label">Nama Pasien</label>
              <input type="text" value={form.patient_name} onChange={(e) => f(e.target.value, "patient_name")} className="input" placeholder="Nama lengkap sesuai BPJS" />
            </div>
            <div>
              <label className="label">Poli Tujuan</label>
              <select value={form.poli} onChange={(e) => f(e.target.value, "poli")} className="input">
                {POLI_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">No. Rujukan (jika ada)</label>
              <input type="text" value={form.referral_number} onChange={(e) => f(e.target.value, "referral_number")} className="input" placeholder="Opsional" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Catatan</label>
              <input type="text" value={form.notes} onChange={(e) => f(e.target.value, "notes")} className="input" placeholder="Opsional" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? "Mendaftarkan..." : "Daftarkan"}</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 p-5 flex items-center justify-between">
          <h2 className="font-semibold text-white">Pasien BPJS — {date}</h2>
          <span className="text-sm text-slate-400">{registrations.length} pasien</span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
        ) : registrations.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada pendaftaran BPJS hari ini</div>
        ) : (
          <div className="divide-y divide-slate-700/10">
            {registrations.map((r, i) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600/20 text-sm font-bold text-emerald-300">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{r.patient_name}</p>
                  <p className="text-xs text-slate-500">{r.bpjs_number} · {r.poli}</p>
                  {r.referral_number && <p className="text-xs text-slate-600">Rujukan: {r.referral_number}</p>}
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold flex-shrink-0 ${STATUS_MAP[r.status] ?? ""}`}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
                <div className="flex gap-2 flex-shrink-0">
                  {r.status === "registered" && (
                    <button onClick={() => updateStatus(r.id, "called")} className="rounded-xl bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs text-blue-300">Panggil</button>
                  )}
                  {r.status === "called" && (
                    <button onClick={() => updateStatus(r.id, "done")} className="rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300">Selesai</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
