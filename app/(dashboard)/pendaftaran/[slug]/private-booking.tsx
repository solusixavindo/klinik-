"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

type Patient = { id: string; name: string; phone?: string }
type Doctor = { id: string; name: string; specialization?: string }
type Schedule = { id: string; doctor_id: string; day: string; start_time: string; end_time: string; doctors?: Doctor }
type Booking = {
  id: string
  visit_date: string
  price: number
  payment_status: string
  visit_type?: string
  notes?: string
  patients?: Patient
  doctors?: Doctor
}

const DAY_NAMES: Record<string, string> = {
  monday: "Senin", tuesday: "Selasa", wednesday: "Rabu",
  thursday: "Kamis", friday: "Jumat", saturday: "Sabtu", sunday: "Minggu",
}

const PAYMENT_MAP: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  partial: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
}
const PAYMENT_LABEL: Record<string, string> = {
  pending: "Belum Bayar", partial: "Bayar Sebagian", paid: "Lunas", cancelled: "Batal",
}

const emptyForm = {
  patient_id: "",
  new_patient_name: "",
  new_patient_phone: "",
  doctor_id: "",
  visit_date: new Date().toISOString().slice(0, 10),
  visit_time: "",
  price: "",
  notes: "",
}

export default function PrivateBookingPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10))

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const [bookRes, schedRes] = await Promise.all([
        fetch("/api/bookings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/schedules", { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const bookData = await bookRes.json()
      const schedData = await schedRes.json()
      if (!bookRes.ok || !bookData.success) throw new Error(bookData.error)
      setPatients(bookData.patients || [])
      setDoctors(bookData.doctors || [])
      setBookings(bookData.bookings || [])
      if (schedData.success) setSchedules(schedData.schedules || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const doctorSchedules = schedules.filter((s) => s.doctor_id === form.doctor_id)

  const todayBookings = bookings.filter((b) => {
    const dateMatch = b.visit_date?.slice(0, 10) === filterDate
    return dateMatch
  })

  const handleSave = async () => {
    if (!form.doctor_id || !form.visit_date || !form.price) {
      setError("Dokter, tanggal, dan harga wajib diisi")
      return
    }
    if (!isNewPatient && !form.patient_id) {
      setError("Pilih pasien atau aktifkan mode pasien baru")
      return
    }
    if (isNewPatient && !form.new_patient_name) {
      setError("Nama pasien baru wajib diisi")
      return
    }
    setSaving(true)
    setError("")
    try {
      const token = await getToken()
      let patientId = form.patient_id

      if (isNewPatient) {
        // Create patient first via bookings endpoint doesn't support it, so use patients API if available
        // For now we'll show an error and suggest using patient management
        // Actually, we need to handle new patient creation via a different approach
        // The bookings API requires patient_id, so we need to create patient first
        const pRes = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: form.new_patient_name, phone: form.new_patient_phone }),
        })
        if (!pRes.ok) {
          // If patients endpoint doesn't exist, tell user to add patient first
          setError("Tidak dapat membuat pasien baru otomatis. Tambahkan pasien melalui menu Pasien terlebih dahulu, lalu gunakan mode 'Pasien Lama'.")
          setSaving(false)
          return
        }
        const pData = await pRes.json()
        if (!pData.success) throw new Error(pData.error)
        patientId = pData.patient?.id || pData.id
      }

      const visitDatetime = form.visit_time
        ? `${form.visit_date}T${form.visit_time}:00`
        : form.visit_date

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: form.doctor_id,
          visit_date: visitDatetime,
          price: Number(form.price),
          notes: form.notes,
          visit_type: "regular",
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setShowForm(false)
      setForm(emptyForm)
      setIsNewPatient(false)
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal membuat booking")
    } finally {
      setSaving(false)
    }
  }

  const updatePayment = async (id: string, payment_status: string) => {
    const token = await getToken()
    await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, payment_status }),
    })
    load()
  }

  const f = (v: string, k: string) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pendaftaran</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Booking Privat</h1>
          <p className="mt-1 text-sm text-slate-400">Pendaftaran pasien berbayar non-BPJS</p>
        </div>
        <div className="flex gap-3">
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="input w-auto" />
          <button onClick={() => { setShowForm(true); setError("") }} className="btn-primary text-sm">+ Booking Privat</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Total Booking</p>
          <p className="mt-2 text-3xl font-bold text-white">{todayBookings.length}</p>
          <p className="text-xs text-slate-500 mt-1">Hari ini</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Sudah Bayar</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{todayBookings.filter((b) => b.payment_status === "paid").length}</p>
          <p className="text-xs text-slate-500 mt-1">Lunas</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Pendapatan</p>
          <p className="mt-2 text-2xl font-bold text-white">
            Rp {todayBookings.filter((b) => b.payment_status === "paid").reduce((s, b) => s + (b.price || 0), 0).toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-slate-500 mt-1">Dari booking lunas</p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Form Booking Privat</h2>
            <button onClick={() => { setShowForm(false); setError("") }} className="text-slate-400 hover:text-white">✕</button>
          </div>

          {/* Patient toggle */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsNewPatient(false)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${!isNewPatient ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
            >
              Pasien Lama
            </button>
            <button
              onClick={() => setIsNewPatient(true)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${isNewPatient ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
            >
              Pasien Baru
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {!isNewPatient ? (
              <div>
                <label className="label">Pilih Pasien</label>
                <select value={form.patient_id} onChange={(e) => f(e.target.value, "patient_id")} className="input">
                  <option value="">-- Pilih Pasien --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}{p.phone ? ` · ${p.phone}` : ""}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="label">Nama Pasien Baru</label>
                  <input type="text" value={form.new_patient_name} onChange={(e) => f(e.target.value, "new_patient_name")} className="input" placeholder="Nama lengkap" />
                </div>
                <div>
                  <label className="label">No. HP</label>
                  <input type="tel" value={form.new_patient_phone} onChange={(e) => f(e.target.value, "new_patient_phone")} className="input" placeholder="08xx-xxxx-xxxx" />
                </div>
              </>
            )}

            <div>
              <label className="label">Dokter / Spesialis</label>
              <select value={form.doctor_id} onChange={(e) => f(e.target.value, "doctor_id")} className="input">
                <option value="">-- Pilih Dokter --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` · ${d.specialization}` : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tanggal Kunjungan</label>
              <input type="date" value={form.visit_date} onChange={(e) => f(e.target.value, "visit_date")} className="input" />
            </div>

            <div>
              <label className="label">Jam Kunjungan (opsional)</label>
              <input type="time" value={form.visit_time} onChange={(e) => f(e.target.value, "visit_time")} className="input" />
            </div>

            <div>
              <label className="label">Harga Konsultasi (Rp)</label>
              <input type="number" value={form.price} onChange={(e) => f(e.target.value, "price")} className="input" placeholder="150000" min="0" />
            </div>

            <div className="md:col-span-2">
              <label className="label">Catatan Khusus</label>
              <input type="text" value={form.notes} onChange={(e) => f(e.target.value, "notes")} className="input" placeholder="Catatan untuk dokter atau staf (opsional)" />
            </div>
          </div>

          {/* Doctor schedule info */}
          {form.doctor_id && doctorSchedules.length > 0 && (
            <div className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Jadwal Praktek</p>
              <div className="flex flex-wrap gap-2">
                {doctorSchedules.map((s) => (
                  <span key={s.id} className="rounded-xl bg-indigo-900/30 border border-indigo-500/20 px-3 py-1 text-xs text-indigo-300">
                    {DAY_NAMES[s.day] ?? s.day} · {s.start_time}–{s.end_time}
                  </span>
                ))}
              </div>
            </div>
          )}
          {form.doctor_id && doctorSchedules.length === 0 && (
            <p className="text-xs text-slate-500">Belum ada jadwal praktek tersimpan untuk dokter ini.</p>
          )}

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? "Menyimpan..." : "Buat Booking"}</button>
            <button onClick={() => { setShowForm(false); setError("") }} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 p-5 flex items-center justify-between">
          <h2 className="font-semibold text-white">Booking — {filterDate}</h2>
          <span className="text-sm text-slate-400">{todayBookings.length} booking</span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
        ) : todayBookings.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada booking pada tanggal ini</div>
        ) : (
          <div className="divide-y divide-slate-700/10">
            {todayBookings.map((b, i) => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-sm font-bold text-indigo-300">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{b.patients?.name ?? "—"}</p>
                  <p className="text-xs text-slate-500">{b.doctors?.name ?? "—"} · Rp {(b.price || 0).toLocaleString("id-ID")}</p>
                  {b.notes && <p className="text-xs text-slate-600 truncate">{b.notes}</p>}
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold flex-shrink-0 ${PAYMENT_MAP[b.payment_status] ?? ""}`}>
                  {PAYMENT_LABEL[b.payment_status] ?? b.payment_status}
                </span>
                <div className="flex gap-2 flex-shrink-0">
                  {b.payment_status === "pending" && (
                    <button onClick={() => updatePayment(b.id, "paid")} className="rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300">Lunas</button>
                  )}
                  {b.payment_status === "partial" && (
                    <button onClick={() => updatePayment(b.id, "paid")} className="rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300">Lunas</button>
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
