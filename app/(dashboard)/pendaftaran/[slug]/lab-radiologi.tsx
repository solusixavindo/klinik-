"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

type Patient = { id: string; name: string; phone?: string }
type Doctor = { id: string; name: string; specialization?: string }
type LabEntry = {
  id: string
  patient_id: string
  doctor_id?: string
  exam_type: string
  exam_category: string
  clinical_notes?: string
  exam_date: string
  status: string
  patients?: Patient
  doctors?: Doctor
}

const LAB_EXAMS = [
  "Darah Lengkap (DL)",
  "Urine Rutin",
  "Gula Darah Puasa",
  "Gula Darah 2 Jam PP",
  "HbA1c",
  "Kolesterol Total",
  "Trigliserida",
  "HDL / LDL",
  "Asam Urat",
  "Ureum / Kreatinin",
  "SGOT / SGPT",
  "Bilirubin Total",
  "Albumin",
  "Elektrolit (Na, K, Cl)",
  "Tes Kehamilan (HCG)",
  "Golongan Darah",
  "Widal",
  "NS1 Dengue",
  "Rapid Antigen COVID-19",
]

const RADIO_EXAMS = [
  "Foto Thorax PA",
  "Foto Thorax AP",
  "Foto Abdomen Polos",
  "Foto Pelvis",
  "Foto Lumbal",
  "Foto Cervical",
  "Foto Extremitas Atas",
  "Foto Extremitas Bawah",
  "USG Abdomen",
  "USG Pelvis",
  "USG Mammae",
  "USG Tiroid",
  "USG Kandungan",
  "EKG / ECG",
  "Spirometri",
]

const STATUS_MAP: Record<string, string> = {
  registered: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  processing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  done: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
}
const STATUS_LABEL: Record<string, string> = {
  registered: "Terdaftar", processing: "Diproses", done: "Selesai", cancelled: "Batal",
}

const emptyForm = {
  patient_id: "",
  doctor_id: "",
  exam_type: "",
  clinical_notes: "",
  exam_date: new Date().toISOString().slice(0, 10),
}

export default function LabRadiologiPage() {
  const [activeTab, setActiveTab] = useState<"lab" | "radiologi">("lab")
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [entries, setEntries] = useState<LabEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [moduleError, setModuleError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10))

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  const loadBase = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch("/api/bookings", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) {
        setPatients(data.patients || [])
        setDoctors(data.doctors || [])
      }
    } catch {
      // silent
    }
  }, [])

  const loadEntries = useCallback(async () => {
    setLoading(true)
    setModuleError("")
    try {
      const token = await getToken()
      const res = await fetch(`/api/lab?date=${filterDate}&category=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 404) {
        setModuleError("Modul laboratorium belum dikonfigurasi. Hubungi administrator.")
        setEntries([])
        return
      }
      const data = await res.json()
      if (!data.success) {
        setModuleError(data.error || "Gagal memuat data laboratorium.")
        setEntries([])
        return
      }
      setEntries(data.entries || data.registrations || [])
    } catch {
      setModuleError("Modul laboratorium belum dikonfigurasi. Hubungi administrator.")
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [filterDate, activeTab])

  useEffect(() => {
    loadBase()
  }, [loadBase])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const handleSave = async () => {
    if (!form.patient_id || !form.exam_type || !form.exam_date) {
      setError("Pasien, jenis pemeriksaan, dan tanggal wajib diisi")
      return
    }
    setSaving(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: form.patient_id,
          doctor_id: form.doctor_id || null,
          exam_type: form.exam_type,
          exam_category: activeTab,
          clinical_notes: form.clinical_notes,
          exam_date: form.exam_date,
        }),
      })
      if (res.status === 404) {
        setError("Modul laboratorium belum dikonfigurasi. Hubungi administrator.")
        setSaving(false)
        return
      }
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Gagal menyimpan pendaftaran")
      setShowForm(false)
      setForm(emptyForm)
      loadEntries()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mendaftarkan pemeriksaan")
    } finally {
      setSaving(false)
    }
  }

  const f = (v: string, k: string) => setForm((p) => ({ ...p, [k]: v }))

  const examList = activeTab === "lab" ? LAB_EXAMS : RADIO_EXAMS
  const todayEntries = entries.filter((e) => e.exam_date?.slice(0, 10) === filterDate)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pendaftaran</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Lab & Radiologi</h1>
          <p className="mt-1 text-sm text-slate-400">Pendaftaran pemeriksaan laboratorium dan radiologi</p>
        </div>
        <div className="flex gap-3">
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="input w-auto" />
          <button onClick={() => { setShowForm(true); setError("") }} className="btn-primary text-sm">+ Daftar Pemeriksaan</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl bg-slate-800/40 p-1 w-fit">
        <button
          onClick={() => { setActiveTab("lab"); setShowForm(false); setError("") }}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${activeTab === "lab" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          🧪 Laboratorium
        </button>
        <button
          onClick={() => { setActiveTab("radiologi"); setShowForm(false); setError("") }}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${activeTab === "radiologi" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          🩻 Radiologi
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Total Hari Ini</p>
          <p className="mt-2 text-3xl font-bold text-white">{todayEntries.length}</p>
          <p className="text-xs text-slate-500 mt-1">{activeTab === "lab" ? "Pemeriksaan lab" : "Pemeriksaan radiologi"}</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Diproses</p>
          <p className="mt-2 text-3xl font-bold text-blue-400">{todayEntries.filter((e) => e.status === "processing").length}</p>
          <p className="text-xs text-slate-500 mt-1">Sedang dianalisis</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Selesai</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{todayEntries.filter((e) => e.status === "done").length}</p>
          <p className="text-xs text-slate-500 mt-1">Hasil siap</p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">
              Pendaftaran {activeTab === "lab" ? "Laboratorium" : "Radiologi"}
            </h2>
            <button onClick={() => { setShowForm(false); setError("") }} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Pasien</label>
              <select value={form.patient_id} onChange={(e) => f(e.target.value, "patient_id")} className="input">
                <option value="">-- Pilih Pasien --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.phone ? ` · ${p.phone}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Dokter Pengirim</label>
              <select value={form.doctor_id} onChange={(e) => f(e.target.value, "doctor_id")} className="input">
                <option value="">-- Pilih Dokter (opsional) --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` · ${d.specialization}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Jenis Pemeriksaan</label>
              <select value={form.exam_type} onChange={(e) => f(e.target.value, "exam_type")} className="input">
                <option value="">-- Pilih Pemeriksaan --</option>
                {examList.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tanggal Pemeriksaan</label>
              <input type="date" value={form.exam_date} onChange={(e) => f(e.target.value, "exam_date")} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Catatan Klinis</label>
              <input
                type="text"
                value={form.clinical_notes}
                onChange={(e) => f(e.target.value, "clinical_notes")}
                className="input"
                placeholder="Diagnosis awal, keluhan, indikasi pemeriksaan (opsional)"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? "Mendaftarkan..." : "Daftarkan"}
            </button>
            <button onClick={() => { setShowForm(false); setError("") }} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 p-5 flex items-center justify-between">
          <h2 className="font-semibold text-white">
            {activeTab === "lab" ? "Laboratorium" : "Radiologi"} — {filterDate}
          </h2>
          <span className="text-sm text-slate-400">{todayEntries.length} pemeriksaan</span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
        ) : moduleError ? (
          <div className="flex flex-col h-40 items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">⚠️</div>
            <p className="text-sm text-amber-300">{moduleError}</p>
          </div>
        ) : todayEntries.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">
            Belum ada pendaftaran {activeTab === "lab" ? "laboratorium" : "radiologi"} hari ini
          </div>
        ) : (
          <div className="divide-y divide-slate-700/10">
            {todayEntries.map((e, i) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-sm font-bold text-indigo-300">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{e.patients?.name ?? "—"}</p>
                  <p className="text-xs text-slate-500">{e.exam_type}</p>
                  {e.doctors && <p className="text-xs text-slate-600">Pengirim: {e.doctors.name}</p>}
                  {e.clinical_notes && <p className="text-xs text-slate-600 truncate">{e.clinical_notes}</p>}
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold flex-shrink-0 ${STATUS_MAP[e.status] ?? "bg-slate-700/20 text-slate-300 border-slate-600/30"}`}>
                  {STATUS_LABEL[e.status] ?? e.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
