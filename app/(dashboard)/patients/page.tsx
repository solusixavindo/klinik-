/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useProfile } from "@/hooks/useProfile"
import { getDemoSession } from "@/lib/demoSession"
import { demoPatients } from "@/lib/demoData"

type Patient = {
  id: string
  name: string
  phone: string
  gender?: string
  birth_date?: string
  address?: string
  clinic_id?: string
  created_at?: string
}

const initialForm = {
  name: "",
  phone: "",
  gender: "",
  birth_date: "",
  address: "",
}

export default function PatientsPage() {
  const { profile, loading: profileLoading } = useProfile()

  const [data, setData] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)
  const [showForm, setShowForm] = useState(false)

  const fetchData = useCallback(async () => {
    if (!profile?.clinic_id) return

    if (getDemoSession()) {
      setData(demoPatients)
      return
    }

    setLoading(true)
    const { data: patientsData, error } = await supabase
      .from("patients")
      .select("*")
      .eq("clinic_id", profile.clinic_id)
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
    }

    setData(patientsData || [])
    setLoading(false)
  }, [profile])

  useEffect(() => {
    if (!profile?.clinic_id) return
    fetchData()
  }, [profile, fetchData])

  const submit = async () => {
    if (!form.name || !form.phone) {
      alert("Nama & No. HP wajib diisi")
      return
    }

    const payload = {
      id: editId ?? `demo-patient-${Date.now()}`,
      name: form.name,
      phone: form.phone,
      gender: form.gender || undefined,
      birth_date: form.birth_date || undefined,
      address: form.address || undefined,
      clinic_id: profile?.clinic_id,
    }

    if (getDemoSession()) {
      setData((current) =>
        editId
          ? current.map((item) => item.id === editId ? { ...item, ...payload } : item)
          : [{ ...payload, created_at: new Date().toISOString() }, ...current]
      )
      setEditId(null)
      setForm(initialForm)
      setShowForm(false)
      return
    }

    const action = editId
      ? supabase.from("patients").update(payload).eq("id", editId)
      : supabase.from("patients").insert([payload])

    const { error } = await action
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
    if (!confirm("Hapus pasien ini?")) return
    if (getDemoSession()) {
      setData((current) => current.filter((item) => item.id !== id))
      return
    }

    const { error } = await supabase.from("patients").delete().eq("id", id)
    if (error) {
      alert(error.message)
      return
    }
    fetchData()
  }

  const filtered = useMemo(
    () =>
      data.filter((p) =>
        (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.phone || "").includes(search)
      ),
    [data, search]
  )

  if (profileLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-slate-400">Loading data pasien...</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">👥 Manajemen Pasien</h1>
          <p className="text-slate-400">Total pasien: <span className="font-semibold text-indigo-400">{data.length}</span></p>
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
          ➕ Tambah Pasien
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 backdrop-blur-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6">
            {editId ? "Edit Pasien" : "Tambah Pasien Baru"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Nama Pasien *</label>
              <input
                placeholder="Nama lengkap"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">No. HP *</label>
              <input
                placeholder="08xx-xxxx-xxxx"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Jenis Kelamin</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input"
              >
                <option value="">Pilih...</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Tanggal Lahir</label>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-200 mb-2">Alamat</label>
              <textarea
                placeholder="Alamat lengkap"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input resize-none"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={submit} className="btn-primary">
              {editId ? "Perbarui" : "Simpan"}
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

      {/* Search */}
      <div>
        <input
          placeholder="🔍 Cari pasien berdasarkan nama atau nomor HP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400">Loading data...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 backdrop-blur-xl p-12 text-center">
            <p className="text-slate-400 text-lg">Belum ada data pasien</p>
            <p className="text-slate-500 text-sm mt-2">Mulai tambahkan pasien baru untuk memulai</p>
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 backdrop-blur-xl p-4 shadow-md hover:shadow-lg hover:border-slate-600/30 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{p.name}</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="text-slate-400">
                      <span className="text-slate-500">📞</span> {p.phone}
                    </div>
                    {p.gender && (
                      <div className="text-slate-400">
                        <span className="text-slate-500">👤</span> {p.gender}
                      </div>
                    )}
                    {p.birth_date && (
                      <div className="text-slate-400">
                        <span className="text-slate-500">📅</span> {p.birth_date}
                      </div>
                    )}
                  </div>
                  {p.address && (
                    <div className="mt-3 text-sm text-slate-500">
                      📍 {p.address}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setEditId(p.id)
                      setForm({
                        name: p.name || "",
                        phone: p.phone || "",
                        gender: p.gender || "",
                        birth_date: p.birth_date || "",
                        address: p.address || "",
                      })
                      setShowForm(true)
                    }}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => del(p.id)}
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
