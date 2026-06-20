"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
const getToken = async () =>
  (await supabase.auth.getSession()).data.session?.access_token

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER wrappers (kept for backward compatibility / non-implemented slugs)
// ─────────────────────────────────────────────────────────────────────────────
export function MedicalRecordsWrapper() {
  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Rekam Medis Elektronik</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Fitur premium tersedia untuk paket Professional.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 shadow-md">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏥</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Rekam Medis Elektronik Premium</h3>
            <p className="text-slate-400 mb-6">Catatan medis digital lengkap dengan riwayat, diagnosis, dan treatment plan.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function QueueWrapper() {
  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Antrian Poli</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Sistem manajemen antrian digital untuk efisiensi pelayanan.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 shadow-md">
          <div className="text-center py-12">
            <span className="text-4xl">⏱️</span>
            <h3 className="text-xl font-bold text-white mt-4 mb-2">Sistem Antrian Digital</h3>
            <p className="text-slate-400">Pantau antrian real-time dengan display TV dan notifikasi otomatis.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CounterQueueWrapper() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Antrian Loket</h1>
      </div>
    </div>
  )
}

export function PharmacyQueueWrapper() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Antrian Apotek</h1>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// E-RESEP
// ─────────────────────────────────────────────────────────────────────────────
type Patient = { id: string; name: string; phone?: string }
type Doctor = { id: string; name: string; specialization?: string }
type MedRecord = {
  id: string
  visit_date: string
  chief_complaint: string | null
  diagnosis: string | null
  treatment: string | null
  prescription: string | null
  notes: string | null
  patients: { name: string } | null
  doctors: { name: string } | null
}

const emptyRxForm = {
  patient_id: "", doctor_id: "",
  visit_date: new Date().toISOString().slice(0, 10),
  prescription: "", diagnosis: "", treatment: "",
}

export function PrescriptionWrapper() {
  const [records, setRecords] = useState<MedRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [filterPatient, setFilterPatient] = useState("")
  const [detail, setDetail] = useState<MedRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyRxForm)

  const loadData = useCallback(async (patId?: string) => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const url = `/api/medical-records${patId ? `?patient_id=${patId}` : ""}`
      const [recRes, bookRes] = await Promise.all([
        fetch(url, { headers }),
        fetch("/api/bookings", { headers }),
      ])
      const [recData, bookData] = await Promise.all([recRes.json(), bookRes.json()])
      if (!recRes.ok) throw new Error(recData.error)
      // Only keep records that have a prescription
      setRecords((recData.records as MedRecord[]).filter((r) => r.prescription?.trim()))
      if (bookData.success) {
        setPatients(bookData.patients ?? [])
        setDoctors(bookData.doctors ?? [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleFilter = (patId: string) => {
    setFilterPatient(patId)
    loadData(patId || undefined)
  }

  const f = (v: string, key: string) => setForm((prev) => ({ ...prev, [key]: v }))

  const handleSave = async () => {
    if (!form.patient_id || !form.doctor_id || !form.visit_date || !form.prescription.trim()) {
      setError("Pasien, dokter, tanggal, dan resep wajib diisi")
      return
    }
    setSaving(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setShowForm(false)
      setForm(emptyRxForm)
      loadData(filterPatient || undefined)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6">
      <style>{`@media print { .no-print { display: none !important; } .print-only { display: block !important; } }`}</style>

      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">E-Resep</h1>
        </div>
        <button onClick={() => { setShowForm(true); setError(""); setDetail(null) }} className="btn-primary text-sm no-print">
          + Tambah Resep
        </button>
      </div>

      {error && <div className="no-print rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="no-print flex gap-3">
        <select value={filterPatient} onChange={(e) => handleFilter(e.target.value)} className="input">
          <option value="">Semua Pasien</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="no-print rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Tambah Resep Baru</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Pasien</label>
              <select value={form.patient_id} onChange={(e) => f(e.target.value, "patient_id")} className="input">
                <option value="">Pilih Pasien</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dokter</label>
              <select value={form.doctor_id} onChange={(e) => f(e.target.value, "doctor_id")} className="input">
                <option value="">Pilih Dokter</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tanggal</label>
              <input type="date" value={form.visit_date} onChange={(e) => f(e.target.value, "visit_date")} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Diagnosis</label>
            <textarea value={form.diagnosis} onChange={(e) => f(e.target.value, "diagnosis")} rows={2} className="input resize-none" placeholder="Diagnosis dokter..." />
          </div>
          <div>
            <label className="label">Tindakan</label>
            <textarea value={form.treatment} onChange={(e) => f(e.target.value, "treatment")} rows={2} className="input resize-none" placeholder="Tindakan yang dilakukan..." />
          </div>
          <div>
            <label className="label">Resep Obat</label>
            <textarea value={form.prescription} onChange={(e) => f(e.target.value, "prescription")} rows={4} className="input resize-none" placeholder="Contoh:&#10;1. Amoxicillin 500mg 3x1 (7 hari)&#10;2. Paracetamol 500mg 3x1 (bila perlu)" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? "Menyimpan..." : "Simpan Resep"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      {detail && (
        <div className="rounded-3xl border border-slate-700/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between no-print">
            <h2 className="font-semibold text-white">Detail Resep</h2>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="rounded-xl border border-indigo-700/30 bg-indigo-950/30 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-900/40">
                Cetak Resep
              </button>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <p><span className="text-slate-400">Pasien:</span> <span className="text-white font-medium">{detail.patients?.name ?? "—"}</span></p>
            <p><span className="text-slate-400">Dokter:</span> <span className="text-white">{detail.doctors?.name ?? "—"}</span></p>
            <p><span className="text-slate-400">Tanggal:</span> <span className="text-white">{detail.visit_date}</span></p>
          </div>
          {detail.diagnosis && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Diagnosis</p>
              <p className="text-white text-sm">{detail.diagnosis}</p>
            </div>
          )}
          {detail.treatment && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Tindakan</p>
              <p className="text-white text-sm">{detail.treatment}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 mb-2">Resep Obat</p>
            <pre className="rounded-2xl bg-slate-900/60 border border-slate-700/20 p-4 text-sm text-indigo-100 whitespace-pre-wrap font-mono">
              {detail.prescription}
            </pre>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden no-print">
        <div className="border-b border-slate-700/20 p-5">
          <h2 className="font-semibold text-white">Daftar E-Resep</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
        ) : records.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada resep</div>
        ) : (
          <div className="divide-y divide-slate-700/10">
            {records.map((r) => (
              <button key={r.id} onClick={() => { setDetail(r); setShowForm(false) }}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-800/20 transition">
                <div>
                  <p className="font-medium text-white">{r.patients?.name ?? "—"}</p>
                  <p className="text-xs text-slate-500">{r.doctors?.name} · {r.visit_date}</p>
                </div>
                <p className="text-xs text-slate-400 max-w-xs truncate">{r.prescription}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RAWAT JALAN / POLIKLINIK
// ─────────────────────────────────────────────────────────────────────────────
type Booking = {
  id: string
  visit_date: string
  payment_status: string
  patients: { id: string; name: string } | null
  doctors: { id: string; name: string } | null
}
type QueueEntry = {
  id: string
  queue_number: number
  status: string
  patient_id: string
  doctor_id: string | null
  patients: { name: string } | null
  doctors: { name: string } | null
}

export function OutpatientPolyclinicWrapper() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [filterDoctor, setFilterDoctor] = useState("")
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [bookRes, queueRes] = await Promise.all([
        fetch("/api/bookings", { headers }),
        fetch(`/api/queue?type=poli&date=${date}`, { headers }),
      ])
      const [bookData, queueData] = await Promise.all([bookRes.json(), queueRes.json()])
      if (!bookRes.ok) throw new Error(bookData.error)
      setDoctors(bookData.doctors ?? [])
      setBookings(bookData.bookings ?? [])
      if (queueData.success) setQueue(queueData.queue ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { loadAll() }, [loadAll])

  // Bookings filtered by date and optionally by doctor
  const todayBookings = bookings.filter((b) => {
    const matchDate = b.visit_date === date
    const matchDoctor = !filterDoctor || b.doctors?.id === filterDoctor
    return matchDate && matchDoctor
  })

  const getQueueEntry = (booking: Booking) =>
    queue.find((q) => q.patient_id === booking.patients?.id && (q.doctor_id === booking.doctors?.id || !q.doctor_id))

  const handleCallPatient = async (booking: Booking) => {
    const entry = getQueueEntry(booking)
    if (!entry) return
    setUpdatingId(entry.id)
    try {
      const token = await getToken()
      await fetch("/api/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: entry.id, status: "called" }),
      })
      setQueue((prev) => prev.map((q) => q.id === entry.id ? { ...q, status: "called" } : q))
    } catch {
      // silent
    } finally {
      setUpdatingId(null)
    }
  }

  const statusLabel = (status: string) => {
    if (status === "waiting") return { label: "Menunggu", cls: "bg-amber-500/10 text-amber-300" }
    if (status === "called") return { label: "Dipanggil", cls: "bg-blue-500/10 text-blue-300" }
    if (status === "serving") return { label: "Dilayani", cls: "bg-indigo-500/10 text-indigo-300" }
    if (status === "done") return { label: "Selesai", cls: "bg-emerald-500/10 text-emerald-300" }
    return { label: "Belum Hadir", cls: "bg-slate-700/20 text-slate-400" }
  }

  const total = todayBookings.length
  const done = todayBookings.filter((b) => {
    const q = getQueueEntry(b)
    return q?.status === "done"
  }).length
  const waiting = total - done

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Rawat Jalan / Poliklinik</h1>
        </div>
        <button onClick={loadAll} className="btn-secondary text-sm">Refresh</button>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-sm text-slate-400">Total Pasien</p>
          <p className="mt-2 text-3xl font-bold text-white">{total}</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-sm text-slate-400">Sudah Dilayani</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{done}</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-sm text-slate-400">Menunggu</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">{waiting}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className="input">
          <option value="">Semua Dokter</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 p-5">
          <h2 className="font-semibold text-white">Pasien Hari Ini — {date}</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
        ) : todayBookings.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada booking pada tanggal ini</div>
        ) : (
          <div className="divide-y divide-slate-700/10">
            {todayBookings.map((b, idx) => {
              const entry = getQueueEntry(b)
              const { label, cls } = entry ? statusLabel(entry.status) : { label: "Belum Antri", cls: "bg-slate-700/20 text-slate-400" }
              const canCall = entry && entry.status === "waiting"
              return (
                <div key={b.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-slate-500 w-8">{idx + 1}</span>
                    <div>
                      <p className="font-medium text-white">{b.patients?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{b.doctors?.name ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>
                    {canCall && (
                      <button
                        onClick={() => handleCallPatient(b)}
                        disabled={updatingId === entry?.id}
                        className="rounded-xl border border-indigo-700/30 bg-indigo-950/30 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-900/40 disabled:opacity-50"
                      >
                        Panggil
                      </button>
                    )}
                    <a
                      href={`/pelayanan/rekam-medis-elektronik`}
                      className="rounded-xl border border-slate-700/30 bg-slate-800/30 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/30"
                    >
                      Buka RM
                    </a>
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

// ─────────────────────────────────────────────────────────────────────────────
// LABORATORIUM
// ─────────────────────────────────────────────────────────────────────────────
type LabRequest = {
  id: string
  request_date: string
  test_types: string[]
  status: string
  notes: string | null
  result: string | null
  patients: { name: string } | null
  doctors: { name: string } | null
}

const LAB_TESTS = [
  "Darah Lengkap",
  "Urine Lengkap",
  "Gula Darah",
  "Kolesterol Total",
  "Asam Urat",
  "SGOT/SGPT",
  "Kreatinin",
  "Thyroid (TSH)",
]

const emptyLabForm = {
  patient_id: "", doctor_id: "",
  request_date: new Date().toISOString().slice(0, 10),
  test_types: [] as string[],
  notes: "",
}

export function LaboratoryWrapper() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [requests, setRequests] = useState<LabRequest[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tableNotFound, setTableNotFound] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyLabForm)
  const [detail, setDetail] = useState<LabRequest | null>(null)
  const [resultInput, setResultInput] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [labRes, bookRes] = await Promise.all([
        fetch(`/api/lab?date=${date}`, { headers }),
        fetch("/api/bookings", { headers }),
      ])
      const [labData, bookData] = await Promise.all([labRes.json(), bookRes.json()])
      if (labData.tableNotFound) {
        setTableNotFound(true)
        return
      }
      if (!labRes.ok) throw new Error(labData.error)
      setTableNotFound(false)
      setRequests(labData.requests ?? [])
      if (bookData.success) {
        setPatients(bookData.patients ?? [])
        setDoctors(bookData.doctors ?? [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { loadRequests() }, [loadRequests])

  const toggleTest = (test: string) => {
    setForm((prev) => ({
      ...prev,
      test_types: prev.test_types.includes(test)
        ? prev.test_types.filter((t) => t !== test)
        : [...prev.test_types, test],
    }))
  }

  const handleSave = async () => {
    if (!form.patient_id || form.test_types.length === 0) {
      setError("Pasien dan jenis pemeriksaan wajib diisi")
      return
    }
    setSaving(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.tableNotFound) { setTableNotFound(true); return }
      if (!res.ok || !data.success) throw new Error(data.error)
      setShowForm(false)
      setForm(emptyLabForm)
      loadRequests()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const token = await getToken()
      await fetch("/api/lab", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      })
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
      if (detail?.id === id) setDetail((prev) => prev ? { ...prev, status } : null)
    } catch {
      // silent
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSaveResult = async () => {
    if (!detail) return
    setUpdatingId(detail.id)
    try {
      const token = await getToken()
      await fetch("/api/lab", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: detail.id, result: resultInput, status: "selesai" }),
      })
      setRequests((prev) => prev.map((r) => r.id === detail.id ? { ...r, result: resultInput, status: "selesai" } : r))
      setDetail((prev) => prev ? { ...prev, result: resultInput, status: "selesai" } : null)
    } catch {
      // silent
    } finally {
      setUpdatingId(null)
    }
  }

  const statusBadge = (status: string) => {
    if (status === "selesai") return "bg-emerald-500/10 text-emerald-300"
    if (status === "proses") return "bg-blue-500/10 text-blue-300"
    return "bg-amber-500/10 text-amber-300"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Laboratorium</h1>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); setDetail(null) }}
          disabled={tableNotFound}
          className="btn-primary text-sm disabled:opacity-50"
        >
          + Permintaan Lab Baru
        </button>
      </div>

      {tableNotFound && (
        <div className="rounded-2xl border border-amber-700/30 bg-amber-950/20 p-4 text-sm text-amber-300">
          Tabel <code>lab_requests</code> belum ada. Jalankan <strong>full_setup.sql</strong> di Supabase terlebih dahulu, lalu muat ulang halaman ini.
        </div>
      )}

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      {!tableNotFound && (
        <div className="flex gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
      )}

      {showForm && !tableNotFound && (
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Permintaan Lab Baru</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Pasien</label>
              <select value={form.patient_id} onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))} className="input">
                <option value="">Pilih Pasien</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dokter (opsional)</label>
              <select value={form.doctor_id} onChange={(e) => setForm((p) => ({ ...p, doctor_id: e.target.value }))} className="input">
                <option value="">Pilih Dokter</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tanggal</label>
              <input type="date" value={form.request_date} onChange={(e) => setForm((p) => ({ ...p, request_date: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label mb-2 block">Jenis Pemeriksaan</label>
            <div className="flex flex-wrap gap-2">
              {LAB_TESTS.map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer rounded-xl border border-slate-700/30 bg-slate-800/30 px-3 py-2 text-sm text-slate-300 hover:border-indigo-500/40">
                  <input
                    type="checkbox"
                    checked={form.test_types.includes(t)}
                    onChange={() => toggleTest(t)}
                    className="accent-indigo-500"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Catatan</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="input resize-none"
              placeholder="Catatan tambahan..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? "Menyimpan..." : "Simpan Permintaan"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      {detail && (
        <div className="rounded-3xl border border-slate-700/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Detail Pemeriksaan Lab</h2>
            <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <p><span className="text-slate-400">Pasien:</span> <span className="text-white font-medium">{detail.patients?.name ?? "—"}</span></p>
            <p><span className="text-slate-400">Dokter:</span> <span className="text-white">{detail.doctors?.name ?? "—"}</span></p>
            <p><span className="text-slate-400">Tanggal:</span> <span className="text-white">{detail.request_date}</span></p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">Jenis Pemeriksaan</p>
            <div className="flex flex-wrap gap-2">
              {detail.test_types.map((t) => (
                <span key={t} className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">{t}</span>
              ))}
            </div>
          </div>
          {detail.notes && <div><p className="text-xs text-slate-400 mb-1">Catatan</p><p className="text-sm text-white">{detail.notes}</p></div>}
          <div>
            <label className="label">Hasil Pemeriksaan</label>
            <textarea
              value={resultInput}
              onChange={(e) => setResultInput(e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="Masukkan hasil pemeriksaan lab..."
              defaultValue={detail.result ?? ""}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveResult}
              disabled={updatingId === detail.id}
              className="btn-primary text-sm"
            >
              {updatingId === detail.id ? "Menyimpan..." : "Simpan Hasil"}
            </button>
          </div>
        </div>
      )}

      {!tableNotFound && (
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
          <div className="border-b border-slate-700/20 p-5">
            <h2 className="font-semibold text-white">Daftar Permintaan Lab — {date}</h2>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
          ) : requests.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada permintaan lab pada tanggal ini</div>
          ) : (
            <div className="divide-y divide-slate-700/10">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <button
                    onClick={() => { setDetail(r); setResultInput(r.result ?? ""); setShowForm(false) }}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-white">{r.patients?.name ?? "—"}</p>
                    <p className="text-xs text-slate-500">{r.test_types.join(", ")}</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(r.status)}`}>
                      {r.status === "selesai" ? "Selesai" : r.status === "proses" ? "Proses" : "Pending"}
                    </span>
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, "proses")}
                        disabled={updatingId === r.id}
                        className="rounded-xl border border-blue-700/30 bg-blue-950/30 px-2 py-1 text-xs text-blue-300 hover:bg-blue-900/40 disabled:opacity-50"
                      >
                        Proses
                      </button>
                    )}
                    {r.status === "proses" && (
                      <button
                        onClick={() => { setDetail(r); setResultInput(r.result ?? ""); setShowForm(false) }}
                        className="rounded-xl border border-emerald-700/30 bg-emerald-950/30 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-900/40"
                      >
                        Input Hasil
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
