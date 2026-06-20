"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"

type QueueEntry = {
  id: string
  queue_number: number
  queue_type: string
  queue_date: string
  status: string
  notes: string | null
  called_at: string | null
  patients: { name: string; phone?: string } | null
  doctors: { name: string; specialization?: string } | null
}
type Patient = { id: string; name: string }
type Doctor = { id: string; name: string; specialization?: string }

type QueueTab = "loket" | "poli" | "apotek"

const TAB_LABELS: Record<QueueTab, string> = { loket: "Antrian Loket", poli: "Antrian Poli", apotek: "Antrian Apotek" }
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  waiting: { label: "Menunggu", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  called: { label: "Dipanggil", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  serving: { label: "Dilayani", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  done: { label: "Selesai", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  cancelled: { label: "Batal", color: "bg-red-500/20 text-red-300 border-red-500/30" },
}

export default function AntrianPoliPage() {
  const [tab, setTab] = useState<QueueTab>("poli")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ patient_id: "", doctor_id: "", notes: "" })
  const [saving, setSaving] = useState(false)

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [qRes, patRes] = await Promise.all([
        fetch(`/api/queue?type=${tab}&date=${date}`, { headers }),
        fetch("/api/bookings", { headers }),
      ])
      const [qData, patData] = await Promise.all([qRes.json(), patRes.json()])
      if (!qRes.ok) throw new Error(qData.error)
      setQueue(qData.queue)
      if (patData.success) {
        setPatients(patData.patients ?? [])
        setDoctors(patData.doctors ?? [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat antrian")
    } finally {
      setLoading(false)
    }
  }, [tab, date])

  useEffect(() => { loadQueue() }, [loadQueue])

  // Auto-refresh setiap 30 detik
  useEffect(() => {
    const interval = setInterval(loadQueue, 30000)
    return () => clearInterval(interval)
  }, [loadQueue])

  const handleAdd = async () => {
    if (!form.patient_id) { setError("Pilih pasien"); return }
    setSaving(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, queue_type: tab, queue_date: date }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setShowForm(false)
      setForm({ patient_id: "", doctor_id: "", notes: "" })
      loadQueue()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menambah antrian")
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const token = await getToken()
    const res = await fetch("/api/queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) loadQueue()
  }

  const waiting = queue.filter((q) => q.status === "waiting").length
  const serving = queue.filter((q) => q.status === "called" || q.status === "serving").length
  const done = queue.filter((q) => q.status === "done").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Manajemen Antrian</h1>
        </div>
        <div className="flex gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-auto" />
          <button onClick={loadQueue} className="btn-secondary text-sm">↻ Refresh</button>
          <button onClick={() => { setShowForm(true); setError("") }} className="btn-primary text-sm">+ Tambah</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-700/20 bg-slate-900/40 p-1 w-fit">
        {(["loket", "poli", "apotek"] as QueueTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${tab === t ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Menunggu", value: waiting, color: "text-amber-300" },
          { label: "Sedang Dilayani", value: serving, color: "text-blue-300" },
          { label: "Selesai", value: done, color: "text-emerald-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Form tambah */}
      {showForm && (
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Tambah ke {TAB_LABELS[tab]}</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Pasien</label>
              <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="input">
                <option value="">Pilih Pasien</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {tab === "poli" && (
              <div>
                <label className="label">Dokter / Poli</label>
                <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className="input">
                  <option value="">Pilih Dokter</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ""}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="label">Catatan</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" placeholder="Opsional..." />
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={saving} className="btn-primary text-sm">
              {saving ? "Menambahkan..." : "Tambah Antrian"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      {/* Antrian list */}
      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 p-5">
          <h2 className="font-semibold text-white">{TAB_LABELS[tab]} — {date}</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat antrian...</div>
        ) : queue.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada antrian hari ini</div>
        ) : (
          <div className="divide-y divide-slate-700/10">
            {queue.map((q) => {
              const st = STATUS_MAP[q.status] ?? STATUS_MAP.waiting
              return (
                <div key={q.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600/20 text-xl font-bold text-indigo-300">
                    {q.queue_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{q.patients?.name ?? "—"}</p>
                    {q.doctors && <p className="text-xs text-slate-500">{q.doctors.name} · {q.doctors.specialization}</p>}
                    {q.notes && <p className="text-xs text-slate-600">{q.notes}</p>}
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                  <div className="flex gap-2 flex-shrink-0">
                    {q.status === "waiting" && (
                      <button onClick={() => updateStatus(q.id, "called")} className="rounded-xl bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-600/30">Panggil</button>
                    )}
                    {q.status === "called" && (
                      <button onClick={() => updateStatus(q.id, "serving")} className="rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-600/30">Layani</button>
                    )}
                    {(q.status === "called" || q.status === "serving") && (
                      <button onClick={() => updateStatus(q.id, "done")} className="rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-600/30">Selesai</button>
                    )}
                    {q.status === "waiting" && (
                      <button onClick={() => updateStatus(q.id, "cancelled")} className="rounded-xl bg-red-600/20 border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-600/30">Batal</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
