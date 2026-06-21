/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useProfile } from "@/hooks/useProfile"
import { getDemoSession } from "@/lib/demoSession"
import { demoDoctors } from "@/lib/demoData"

type Doctor = {
  id: string
  name: string
  specialization: string
  clinic_id?: string
  phone?: string
  email?: string
  experience?: string
}

const initialForm = {
  name: "",
  specialization: "",
  phone: "",
  email: "",
  experience: "",
}

export default function DoctorsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [data, setData] = useState<Doctor[]>([])
  const [form, setForm] = useState(initialForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchData = useCallback(async () => {
    if (!profile) return

    if (getDemoSession()) {
      setData(demoDoctors)
      return
    }

    const query = profile.clinic_id
      ? supabase.from("doctors").select("*").eq("clinic_id", profile.clinic_id)
      : supabase.from("doctors").select("*")

    const { data: doctorsData, error } = await query
    if (error) {
      console.error("Doctors fetch failed", error)
      alert(error.message)
    }

    setData(doctorsData || [])
  }, [profile])

  useEffect(() => {
    if (!profile) return
    fetchData()
  }, [profile, fetchData])

  const submit = async () => {
    if (!form.name || !form.specialization) {
      alert("Nama dokter dan spesialisasi wajib diisi")
      return
    }

    if (!profile?.clinic_id) {
      alert("Data klinik belum tersedia. Silakan login ulang.")
      return
    }

    setSaving(true)
    const payload = {
      id: editId ?? `demo-doctor-${Date.now()}`,
      name: form.name.trim(),
      specialization: form.specialization.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      experience: form.experience.trim() || undefined,
    }

    if (getDemoSession()) {
      setData((current) =>
        editId
          ? current.map((item) => item.id === editId ? { ...item, ...payload } : item)
          : [{ ...payload, clinic_id: profile.clinic_id }, ...current]
      )
      setSaving(false)
      setEditId(null)
      setForm(initialForm)
      setShowForm(false)
      return
    }

    const action = editId
      ? supabase.from("doctors").update(payload).eq("id", editId)
      : supabase.from("doctors").insert([{ ...payload, clinic_id: profile.clinic_id }])

    const { error } = await action
    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    setEditId(null)
    setForm(initialForm)
    setShowForm(false)
    fetchData()
  }

  const del = async (id: string) => {
    if (!confirm("Hapus dokter ini?")) return
    if (getDemoSession()) {
      setData((current) => current.filter((item) => item.id !== id))
      return
    }

    const { error } = await supabase.from("doctors").delete().eq("id", id)
    if (error) {
      alert(error.message)
      return
    }
    fetchData()
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading data dokter...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">🩺 Manajemen Dokter</h1>
          <p className="text-slate-400">Total dokter: <span className="font-semibold text-indigo-400">{data.length}</span></p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            if (editId) {
              setEditId(null)
              setForm(initialForm)
            }
          }}
          className="btn-primary"
        >
          ➕ Tambah Dokter
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 backdrop-blur-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6">
            {editId ? "Edit Dokter" : "Tambah Dokter Baru"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Nama Dokter *</label>
              <input
                placeholder="Dr. Nama Lengkap"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Spesialisasi *</label>
              <input
                placeholder="Contoh: Dokter Umum, Gigi, dll"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">No. HP</label>
              <input
                placeholder="08xx-xxxx-xxxx"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Email</label>
              <input
                type="email"
                placeholder="dokter@klinik.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-200 mb-2">Pengalaman</label>
              <input
                placeholder="Contoh: 5 tahun"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={submit} disabled={saving} className="btn-primary">
              {saving ? "Menyimpan..." : editId ? "Perbarui" : "Simpan"}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setEditId(null)
                setForm(initialForm)
              }}
              className="btn-secondary"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 backdrop-blur-xl p-12 text-center">
            <p className="text-slate-400 text-lg">Belum ada data dokter</p>
            <p className="text-slate-500 text-sm mt-2">Mulai tambahkan dokter baru untuk memulai</p>
          </div>
        ) : (
          data.map((d) => (
            <div
              key={d.id}
              className="group rounded-2xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 backdrop-blur-xl p-4 shadow-md hover:shadow-lg hover:border-slate-600/30 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">👨‍⚕️ {d.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <span className="text-slate-500">📋</span>
                      <span>{d.specialization}</span>
                    </div>
                    {d.phone && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span className="text-slate-500">📞</span>
                        <span>{d.phone}</span>
                      </div>
                    )}
                    {d.email && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span className="text-slate-500">✉️</span>
                        <span>{d.email}</span>
                      </div>
                    )}
                    {d.experience && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span className="text-slate-500">📅</span>
                        <span>{d.experience}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setEditId(d.id)
                      setForm({
                        name: d.name || "",
                        specialization: d.specialization || "",
                        phone: d.phone || "",
                        email: d.email || "",
                        experience: d.experience || "",
                      })
                      setShowForm(true)
                    }}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => del(d.id)}
                    className="btn-ghost text-sm px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
