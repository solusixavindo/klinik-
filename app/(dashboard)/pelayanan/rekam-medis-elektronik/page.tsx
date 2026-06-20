"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"

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
  systolic_bp: number | null
  diastolic_bp: number | null
  heart_rate: number | null
  temperature: number | null
  weight: number | null
  height: number | null
  patients: { name: string; phone?: string } | null
  doctors: { name: string; specialization?: string } | null
}

const emptyForm = {
  patient_id: "", doctor_id: "", visit_date: new Date().toISOString().slice(0, 10),
  chief_complaint: "", diagnosis: "", treatment: "", prescription: "", notes: "",
  systolic_bp: "", diastolic_bp: "", heart_rate: "", temperature: "", weight: "", height: "",
}

export default function RekamMedisPage() {
  const [records, setRecords] = useState<MedRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [filterPatient, setFilterPatient] = useState("")
  const [detail, setDetail] = useState<MedRecord | null>(null)

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  const loadData = useCallback(async (patId?: string) => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const url = `/api/medical-records${patId ? `?patient_id=${patId}` : ""}`
      const [recRes, patRes] = await Promise.all([
        fetch(url, { headers }),
        fetch("/api/bookings", { headers }),
      ])
      const [recData, patData] = await Promise.all([recRes.json(), patRes.json()])
      if (!recRes.ok) throw new Error(recData.error)
      setRecords(recData.records)
      if (patData.success) {
        setPatients(patData.patients ?? [])
        setDoctors(patData.doctors ?? [])
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

  const handleSave = async () => {
    if (!form.patient_id || !form.doctor_id || !form.visit_date) {
      setError("Pasien, dokter, dan tanggal wajib diisi")
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
      setForm(emptyForm)
      loadData(filterPatient || undefined)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus rekam medis ini?")) return
    const token = await getToken()
    await fetch(`/api/medical-records?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    setDetail(null)
    loadData(filterPatient || undefined)
  }

  const f = (v: string, key: string) => setForm((prev) => ({ ...prev, [key]: v }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Rekam Medis Elektronik</h1>
        </div>
        <button onClick={() => { setShowForm(true); setError(""); setDetail(null) }} className="btn-primary text-sm">
          + Tambah Rekam Medis
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="flex gap-3">
        <select value={filterPatient} onChange={(e) => handleFilter(e.target.value)} className="input">
          <option value="">Semua Pasien</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Tambah Rekam Medis</h2>
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
            <label className="label">Keluhan Utama</label>
            <textarea value={form.chief_complaint} onChange={(e) => f(e.target.value, "chief_complaint")} rows={2} className="input resize-none" placeholder="Keluhan yang disampaikan pasien..." />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Diagnosis</label>
              <textarea value={form.diagnosis} onChange={(e) => f(e.target.value, "diagnosis")} rows={2} className="input resize-none" placeholder="Diagnosis dokter..." />
            </div>
            <div>
              <label className="label">Tindakan / Terapi</label>
              <textarea value={form.treatment} onChange={(e) => f(e.target.value, "treatment")} rows={2} className="input resize-none" placeholder="Tindakan yang dilakukan..." />
            </div>
          </div>
          <div>
            <label className="label">Resep Obat</label>
            <textarea value={form.prescription} onChange={(e) => f(e.target.value, "prescription")} rows={2} className="input resize-none" placeholder="Resep obat..." />
          </div>
          <div>
            <p className="label mb-2">Tanda Vital</p>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {[
                { key: "systolic_bp", label: "Sistol (mmHg)" },
                { key: "diastolic_bp", label: "Diastol (mmHg)" },
                { key: "heart_rate", label: "Nadi (/mnt)" },
                { key: "temperature", label: "Suhu (°C)" },
                { key: "weight", label: "BB (kg)" },
                { key: "height", label: "TB (cm)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-[10px] text-slate-500 mb-1">{label}</label>
                  <input type="number" value={form[key as keyof typeof form]} onChange={(e) => f(e.target.value, key)} className="input py-1.5 text-sm" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Catatan Tambahan</label>
            <textarea value={form.notes} onChange={(e) => f(e.target.value, "notes")} rows={2} className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? "Menyimpan..." : "Simpan Rekam Medis"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      {detail && (
        <div className="rounded-3xl border border-slate-700/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Detail Rekam Medis</h2>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(detail.id)} className="rounded-xl border border-red-700/30 bg-red-950/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/40">Hapus</button>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <p><span className="text-slate-400">Pasien:</span> <span className="text-white">{detail.patients?.name}</span></p>
            <p><span className="text-slate-400">Dokter:</span> <span className="text-white">{detail.doctors?.name}</span></p>
            <p><span className="text-slate-400">Tanggal:</span> <span className="text-white">{detail.visit_date}</span></p>
          </div>
          {detail.chief_complaint && <div><p className="text-xs text-slate-400 mb-1">Keluhan</p><p className="text-white text-sm">{detail.chief_complaint}</p></div>}
          {detail.diagnosis && <div><p className="text-xs text-slate-400 mb-1">Diagnosis</p><p className="text-white text-sm">{detail.diagnosis}</p></div>}
          {detail.treatment && <div><p className="text-xs text-slate-400 mb-1">Tindakan</p><p className="text-white text-sm">{detail.treatment}</p></div>}
          {detail.prescription && <div><p className="text-xs text-slate-400 mb-1">Resep</p><p className="text-white text-sm">{detail.prescription}</p></div>}
          {(detail.systolic_bp || detail.heart_rate || detail.temperature) && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Tanda Vital</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {detail.systolic_bp && <span className="rounded-lg bg-slate-800/50 px-3 py-1 text-slate-200">TD: {detail.systolic_bp}/{detail.diastolic_bp} mmHg</span>}
                {detail.heart_rate && <span className="rounded-lg bg-slate-800/50 px-3 py-1 text-slate-200">Nadi: {detail.heart_rate}/mnt</span>}
                {detail.temperature && <span className="rounded-lg bg-slate-800/50 px-3 py-1 text-slate-200">Suhu: {detail.temperature}°C</span>}
                {detail.weight && <span className="rounded-lg bg-slate-800/50 px-3 py-1 text-slate-200">BB: {detail.weight} kg</span>}
                {detail.height && <span className="rounded-lg bg-slate-800/50 px-3 py-1 text-slate-200">TB: {detail.height} cm</span>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 p-5">
          <h2 className="font-semibold text-white">Riwayat Rekam Medis</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
        ) : records.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada rekam medis</div>
        ) : (
          <div className="divide-y divide-slate-700/10">
            {records.map((r) => (
              <button key={r.id} onClick={() => { setDetail(r); setShowForm(false) }}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-800/20 transition">
                <div>
                  <p className="font-medium text-white">{r.patients?.name ?? "—"}</p>
                  <p className="text-xs text-slate-500">{r.doctors?.name} · {r.visit_date}</p>
                </div>
                <p className="text-xs text-slate-400 max-w-xs truncate">{r.diagnosis ?? "—"}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
