/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useProfile } from "@/hooks/useProfile"

type Doctor = {
  id: string
  name: string
}

type Schedule = {
  id: string
  day: string
  start_time: string
  end_time: string
  doctors?: Doctor
}

type ScheduleForm = {
  doctor_id: string
  day: string
  start_time: string
  end_time: string
}

async function parseSchedulesApiJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const t = await res.text()
    return t ? (JSON.parse(t) as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** API gagal karena service_role salah → pakai Supabase browser + policy RLS Anda. */
function shouldFallbackSchedulesApi(result: Record<string, unknown>, status: number): boolean {
  if (status === 503 && result.code === "SERVICE_ROLE_INVALID") return true
  const err = typeof result.error === "string" ? result.error : ""
  return err.toLowerCase().includes("row-level security")
}

export default function SchedulePage() {
  const { profile, loading: profileLoading } = useProfile()
  const [data, setData] = useState<Schedule[]>([])
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<ScheduleForm>({ doctor_id: "", day: "", start_time: "", end_time: "" })
  const [saving, setSaving] = useState(false)

  /** Lewati RLS browser — sama seperti booking (service role di server). */
  const fetchSchedules = useCallback(async () => {
    if (!profile) return

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      alert("Sesi login tidak valid. Silakan login ulang.")
      return
    }

    const res = await fetch("/api/schedules", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const result = await parseSchedulesApiJson(res)

    if (res.ok && result.success === true && Array.isArray(result.schedules)) {
      setData(result.schedules as Schedule[])
      return
    }

    if (shouldFallbackSchedulesApi(result, res.status) && profile.clinic_id) {
      const { data: rows, error } = await supabase
        .from("schedules")
        .select("*, doctors(*)")
        .eq("clinic_id", profile.clinic_id)
        .order("day", { ascending: true })

      if (error) {
        alert(error.message)
        setData([])
        return
      }
      setData((rows as Schedule[]) ?? [])
      return
    }

    let msg = (typeof result.error === "string" && result.error) || "Gagal mengambil jadwal"
    if (typeof result.hint === "string") msg += `\n\n${result.hint}`
    alert(msg)
    setData([])
  }, [profile])

  useEffect(() => {
    if (!profile) return

    const fetchDoctors = async () => {
      const query = profile.clinic_id
        ? supabase.from("doctors").select("id, name").eq("clinic_id", profile.clinic_id)
        : supabase.from("doctors").select("id, name")
      const { data: doctorsData, error } = await query
      if (error) {
        console.error("Schedule doctors fetch failed", error)
        alert(error.message)
      }
      setDoctors(doctorsData || [])
    }

    fetchDoctors()
    fetchSchedules()
  }, [profile, fetchSchedules])

  const submit = async () => {
    if (!form.doctor_id || !form.day || !form.start_time || !form.end_time) {
      alert("Lengkapi data jadwal")
      return
    }

    setSaving(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        alert("Sesi login tidak valid. Silakan login ulang.")
        return
      }

      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
        cache: "no-store",
      })

      const result = await parseSchedulesApiJson(response)

      if (response.ok && result.success === true) {
        setForm({ doctor_id: "", day: "", start_time: "", end_time: "" })
        fetchSchedules()
        return
      }

      if (shouldFallbackSchedulesApi(result, response.status) && profile?.clinic_id) {
        const { error } = await supabase.from("schedules").insert([
          { ...form, clinic_id: profile.clinic_id },
        ])
        if (error) {
          alert(
            `${error.message}\n\nJika ini tetap RLS: pastikan profile.clinic_id sama dengan policy, atau perbaiki SUPABASE_SERVICE_ROLE_KEY di Hostinger (secret service_role).`
          )
          return
        }
        setForm({ doctor_id: "", day: "", start_time: "", end_time: "" })
        fetchSchedules()
        return
      }

      let msg = (typeof result.error === "string" && result.error) || "Gagal menyimpan jadwal"
      if (typeof result.hint === "string") msg += `\n\n${result.hint}`
      alert(msg)
    } finally {
      setSaving(false)
    }
  }

  const del = async (id: string) => {
    if (!confirm("Hapus jadwal ini?")) return

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        alert("Sesi login tidak valid. Silakan login ulang.")
        return
      }

      const response = await fetch(`/api/schedules?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })

      const result = await parseSchedulesApiJson(response)

      if (response.ok && result.success === true) {
        fetchSchedules()
        return
      }

      if (shouldFallbackSchedulesApi(result, response.status) && profile?.clinic_id) {
        const { error } = await supabase
          .from("schedules")
          .delete()
          .eq("id", id)
          .eq("clinic_id", profile.clinic_id)
        if (error) {
          alert(error.message)
          return
        }
        fetchSchedules()
        return
      }

      let msg = (typeof result.error === "string" && result.error) || "Gagal menghapus jadwal"
      if (typeof result.hint === "string") msg += `\n\n${result.hint}`
      alert(msg)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus jadwal"
      alert(message)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading data jadwal...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">📅 Jadwal Dokter</h1>
          <p className="text-slate-400">Total jadwal: <span className="font-semibold text-indigo-400">{data.length}</span></p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 backdrop-blur-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-6">Tambah Jadwal Dokter</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Pilih Dokter *</label>
            <select
              value={form.doctor_id}
              onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
              className="input"
            >
              <option value="">-- Pilih Dokter --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Hari *</label>
            <select
              value={form.day}
              onChange={(e) => setForm({ ...form, day: e.target.value })}
              className="input"
            >
              <option value="">-- Pilih Hari --</option>
              <option value="Senin">Senin</option>
              <option value="Selasa">Selasa</option>
              <option value="Rabu">Rabu</option>
              <option value="Kamis">Kamis</option>
              <option value="Jumat">Jumat</option>
              <option value="Sabtu">Sabtu</option>
              <option value="Minggu">Minggu</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Jam Mulai *</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Jam Selesai *</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <button onClick={submit} disabled={saving} className="btn-primary">
          {saving ? "Menyimpan..." : "+ Tambah Jadwal"}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 backdrop-blur-xl p-12 text-center">
            <p className="text-slate-400 text-lg">Belum ada data jadwal</p>
            <p className="text-slate-500 text-sm mt-2">Mulai tambahkan jadwal dokter untuk memulai</p>
          </div>
        ) : (
          data.map((s) => (
            <div key={s.id} className="rounded-2xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 backdrop-blur-xl p-4 shadow-md hover:shadow-lg hover:border-slate-600/30 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-3">👨‍⚕️ {s.doctors?.name || "-"}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="text-slate-400">
                      <span className="text-slate-500">📅</span> Hari: <span className="text-white font-medium">{s.day}</span>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500">🕐</span> Jam: <span className="text-white font-medium">{s.start_time} - {s.end_time}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => del(s.id)} className="btn-ghost text-sm px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/20">
                  🗑️ Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
