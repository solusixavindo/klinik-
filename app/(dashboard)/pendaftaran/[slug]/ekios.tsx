"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

type Patient = { id: string; name: string; phone?: string; medical_record_number?: string }
type Doctor = { id: string; name: string; specialization?: string }
type Schedule = { id: string; doctor_id: string; day: string; start_time: string; end_time: string }

type Step = 1 | 2 | 3 | 4

const DAY_NAMES: Record<string, string> = {
  monday: "Senin", tuesday: "Selasa", wednesday: "Rabu",
  thursday: "Kamis", friday: "Jumat", saturday: "Sabtu", sunday: "Minggu",
}

const GENDERS = ["Laki-laki", "Perempuan"]

export default function EKiosPage() {
  const [step, setStep] = useState<Step>(1)
  const [patientType, setPatientType] = useState<"new" | "existing" | "">("")
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [foundPatients, setFoundPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [queueNumber, setQueueNumber] = useState<number | null>(null)

  // Form state
  const [newName, setNewName] = useState("")
  const [newDob, setNewDob] = useState("")
  const [newGender, setNewGender] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  const loadDoctors = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const [bookRes, schedRes] = await Promise.all([
        fetch("/api/bookings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/schedules", { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const bookData = await bookRes.json()
      const schedData = await schedRes.json()
      if (bookData.success) setDoctors(bookData.doctors || [])
      if (schedData.success) setSchedules(schedData.schedules || [])
    } catch {
      // silent fail on initial load
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDoctors() }, [loadDoctors])

  const searchPatients = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/bookings", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      const q = searchQuery.toLowerCase()
      const results = (data.patients as Patient[]).filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.medical_record_number && p.medical_record_number.toLowerCase().includes(q)) ||
          (p.phone && p.phone.includes(q))
      )
      setFoundPatients(results)
      if (results.length === 0) setError("Pasien tidak ditemukan. Pastikan nama atau no. RM sudah benar.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mencari pasien")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedDoctor) { setError("Pilih dokter/poli terlebih dahulu"); return }
    setSaving(true)
    setError("")
    try {
      const token = await getToken()
      let patientId = selectedPatient?.id

      if (patientType === "new") {
        if (!newName.trim()) { setError("Nama pasien wajib diisi"); setSaving(false); return }
        const pRes = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: newName, date_of_birth: newDob || null, gender: newGender || null, phone: newPhone || null }),
        })
        if (pRes.ok) {
          const pData = await pRes.json()
          if (pData.success) patientId = pData.patient?.id || pData.id
        }
        // If patients API not available, create booking with a placeholder approach
        if (!patientId) {
          setError("Tidak dapat membuat data pasien baru. Mohon hubungi petugas.")
          setSaving(false)
          return
        }
      }

      if (!patientId) { setError("Data pasien tidak lengkap"); setSaving(false); return }

      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: selectedDoctor.id,
          queue_type: "poli",
          queue_date: new Date().toISOString().slice(0, 10),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setQueueNumber(data.entry.queue_number)
      setStep(4)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengambil nomor antrian")
    } finally {
      setSaving(false)
    }
  }

  const resetKios = () => {
    setStep(1)
    setPatientType("")
    setNewName("")
    setNewDob("")
    setNewGender("")
    setNewPhone("")
    setSearchQuery("")
    setSelectedPatient(null)
    setSelectedDoctor(null)
    setFoundPatients([])
    setQueueNumber(null)
    setError("")
  }

  const doctorSchedules = (doctorId: string) => schedules.filter((s) => s.doctor_id === doctorId)

  return (
    <div className="min-h-screen space-y-0">
      {/* Header */}
      <div className="border-b border-slate-700/20 bg-slate-900/60 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pendaftaran</p>
          <h1 className="mt-0.5 text-2xl font-bold text-white">Pendaftaran Mandiri — E-Kios</h1>
        </div>
        <div className="flex items-center gap-3">
          {step > 1 && step < 4 && (
            <button onClick={() => setStep((s) => (s - 1) as Step)} className="btn-secondary text-sm">← Kembali</button>
          )}
          <span className="rounded-full bg-indigo-900/40 border border-indigo-500/30 px-4 py-1.5 text-sm text-indigo-300">
            Langkah {step} / 4
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800">
        <div
          className="h-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>
        )}

        {/* Step 1: Tipe Pasien */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">Selamat Datang</p>
              <p className="mt-2 text-lg text-slate-400">Silakan pilih jenis pendaftaran Anda</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() => { setPatientType("new"); setStep(2); setError("") }}
                className="group rounded-3xl border-2 border-indigo-500/30 bg-indigo-950/20 p-8 text-left transition-all hover:border-indigo-400/60 hover:bg-indigo-950/40 active:scale-95"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20 text-3xl mb-4">👤</div>
                <p className="text-xl font-bold text-white">Pasien Baru</p>
                <p className="mt-1 text-sm text-slate-400">Belum pernah berobat di klinik ini</p>
              </button>
              <button
                onClick={() => { setPatientType("existing"); setStep(2); setError("") }}
                className="group rounded-3xl border-2 border-slate-700/30 bg-slate-800/20 p-8 text-left transition-all hover:border-slate-600/60 hover:bg-slate-800/40 active:scale-95"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-700/30 text-3xl mb-4">📋</div>
                <p className="text-xl font-bold text-white">Pasien Lama</p>
                <p className="mt-1 text-sm text-slate-400">Sudah terdaftar / memiliki no. rekam medis</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Data Pasien */}
        {step === 2 && patientType === "new" && (
          <div className="space-y-6">
            <div>
              <p className="text-2xl font-bold text-white">Data Pasien Baru</p>
              <p className="mt-1 text-slate-400">Isi data berikut untuk pendaftaran pertama kali</p>
            </div>
            <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
              <div>
                <label className="label text-base">Nama Lengkap *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input text-lg py-4"
                  placeholder="Nama lengkap sesuai KTP"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label text-base">Tanggal Lahir</label>
                  <input type="date" value={newDob} onChange={(e) => setNewDob(e.target.value)} className="input text-base py-3" />
                </div>
                <div>
                  <label className="label text-base">Jenis Kelamin</label>
                  <select value={newGender} onChange={(e) => setNewGender(e.target.value)} className="input text-base py-3">
                    <option value="">-- Pilih --</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label text-base">No. HP / WhatsApp</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="input text-lg py-4"
                  placeholder="08xx-xxxx-xxxx"
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (!newName.trim()) { setError("Nama wajib diisi"); return }
                setError("")
                setStep(3)
              }}
              className="btn-primary w-full py-4 text-lg"
            >
              Lanjut →
            </button>
          </div>
        )}

        {step === 2 && patientType === "existing" && (
          <div className="space-y-6">
            <div>
              <p className="text-2xl font-bold text-white">Cari Data Pasien</p>
              <p className="mt-1 text-slate-400">Masukkan nama lengkap atau no. rekam medis</p>
            </div>
            <div className="rounded-3xl border border-slate-700/30 bg-slate-800/20 p-6 space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchPatients()}
                  className="input flex-1 text-lg py-4"
                  placeholder="Nama atau no. rekam medis..."
                />
                <button
                  onClick={searchPatients}
                  disabled={loading}
                  className="btn-primary px-6 text-base"
                >
                  {loading ? "..." : "Cari"}
                </button>
              </div>
              {foundPatients.length > 0 && (
                <div className="space-y-2">
                  {foundPatients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPatient(p); setStep(3); setError("") }}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedPatient?.id === p.id ? "border-indigo-500/50 bg-indigo-950/30" : "border-slate-700/20 bg-slate-800/20 hover:border-slate-600/40"}`}
                    >
                      <p className="font-semibold text-white text-lg">{p.name}</p>
                      <p className="text-sm text-slate-400">{p.medical_record_number ? `No. RM: ${p.medical_record_number}` : ""}{p.phone ? ` · ${p.phone}` : ""}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Pilih Poli/Dokter */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="text-2xl font-bold text-white">Pilih Poli / Dokter</p>
              <p className="mt-1 text-slate-400">Pilih dokter yang ingin Anda temui</p>
            </div>
            {loading ? (
              <div className="flex h-32 items-center justify-center text-slate-400">Memuat daftar dokter...</div>
            ) : (
              <div className="space-y-3">
                {doctors.map((d) => {
                  const sched = doctorSchedules(d.id)
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDoctor(d)}
                      className={`w-full rounded-2xl border p-5 text-left transition-all active:scale-[0.99] ${selectedDoctor?.id === d.id ? "border-indigo-500/50 bg-indigo-950/30" : "border-slate-700/20 bg-slate-800/20 hover:border-slate-600/40"}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-lg font-bold text-indigo-300">
                          {d.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-lg">{d.name}</p>
                          {d.specialization && <p className="text-sm text-indigo-400">{d.specialization}</p>}
                          {sched.length > 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                              {sched.map((s) => `${DAY_NAMES[s.day] ?? s.day} ${s.start_time}–${s.end_time}`).join(", ")}
                            </p>
                          )}
                        </div>
                        {selectedDoctor?.id === d.id && (
                          <div className="flex-shrink-0 text-indigo-400 text-xl">✓</div>
                        )}
                      </div>
                    </button>
                  )
                })}
                {doctors.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Belum ada dokter terdaftar</p>
                )}
              </div>
            )}
            {selectedDoctor && (
              <button onClick={handleConfirm} disabled={saving} className="btn-primary w-full py-4 text-lg">
                {saving ? "Mengambil nomor antrian..." : "Ambil Nomor Antrian →"}
              </button>
            )}
          </div>
        )}

        {/* Step 4: Nomor Antrian */}
        {step === 4 && queueNumber !== null && (
          <div className="space-y-8 text-center py-8">
            <div>
              <p className="text-2xl font-bold text-white">Pendaftaran Berhasil!</p>
              <p className="mt-1 text-slate-400">Simpan nomor antrian Anda</p>
            </div>
            <div className="rounded-3xl border-2 border-indigo-500/40 bg-indigo-950/30 p-10 mx-auto max-w-xs">
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-2">Nomor Antrian</p>
              <p className="text-8xl font-black text-white leading-none">{String(queueNumber).padStart(3, "0")}</p>
              <p className="mt-4 text-slate-400 text-sm">
                {selectedDoctor?.name}
                {selectedDoctor?.specialization ? ` · ${selectedDoctor.specialization}` : ""}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700/20 bg-slate-800/20 p-4 text-sm text-slate-400">
              <p>Harap menunggu di ruang tunggu. Nama Anda akan dipanggil sesuai nomor antrian.</p>
            </div>
            <button
              onClick={resetKios}
              className="btn-secondary w-full py-5 text-lg font-semibold"
            >
              Selesai — Pasien Berikutnya
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
