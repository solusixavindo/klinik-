"use client"

import { useMemo, useState } from "react"

type BpjsRow = {
  id: string
  patient: string
  card: string
  poly: string
  referral: string
  status: string
}

const initialRows: BpjsRow[] = [
  { id: "bpjs-1", patient: "Ayu Pratiwi", card: "0001234567890", poly: "Poli Umum", referral: "FKTP Sehat Mandiri", status: "Validasi SEP" },
  { id: "bpjs-2", patient: "Dedi Saputra", card: "0002345678901", poly: "Poli Gigi", referral: "FKTP Bugar Sentosa", status: "Menunggu Berkas" },
  { id: "bpjs-3", patient: "Mira Lestari", card: "0003456789012", poly: "Poli Anak", referral: "FKTP Keluarga Prima", status: "Siap Dilayani" },
]

const initialForm = {
  patient: "",
  card: "",
  poly: "Poli Umum",
  referral: "",
  status: "Validasi Peserta",
}

const statusOptions = ["Validasi Peserta", "Validasi SEP", "Menunggu Berkas", "Siap Dilayani"]
const polyOptions = ["Poli Umum", "Poli Gigi", "Poli Anak", "Poli Kandungan", "Poli Penyakit Dalam"]

export default function BpjsRegistrationDemo() {
  const [rows, setRows] = useState(initialRows)
  const [form, setForm] = useState(initialForm)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const stats = useMemo(() => {
    const ready = rows.filter((row) => row.status === "Siap Dilayani").length
    const needsReview = rows.filter((row) => row.status === "Menunggu Berkas").length

    return {
      total: rows.length,
      ready,
      needsReview,
    }
  }, [rows])

  const resetForm = () => {
    setForm(initialForm)
    setEditId(null)
    setError("")
  }

  const submit = () => {
    const card = form.card.replace(/\D/g, "")

    if (!form.patient.trim() || !card || !form.referral.trim()) {
      setError("Nama pasien, nomor kartu BPJS, dan asal rujukan wajib diisi")
      return
    }

    if (card.length < 13) {
      setError("Nomor kartu BPJS minimal 13 digit")
      return
    }

    const payload: BpjsRow = {
      id: editId || `bpjs-${Date.now()}`,
      patient: form.patient.trim(),
      card,
      poly: form.poly,
      referral: form.referral.trim(),
      status: form.status,
    }

    setRows((current) =>
      editId
        ? current.map((row) => (row.id === editId ? payload : row))
        : [payload, ...current]
    )
    resetForm()
    setShowForm(false)
  }

  const edit = (row: BpjsRow) => {
    setForm({
      patient: row.patient,
      card: row.card,
      poly: row.poly,
      referral: row.referral,
      status: row.status,
    })
    setEditId(row.id)
    setError("")
    setShowForm(true)
  }

  const remove = (id: string) => {
    if (!confirm("Hapus pendaftaran BPJS ini?")) return
    setRows((current) => current.filter((row) => row.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pendaftaran</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Pendaftaran BPJS</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Registrasi pasien BPJS sederhana untuk validasi peserta, tujuan poli, dan status berkas awal.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm((value) => !value)
            if (showForm) resetForm()
          }}
          className="btn-secondary"
        >
          {showForm ? "Tutup Form" : "Tambah Pasien BPJS"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/30 p-6 shadow-md">
          <p className="text-sm text-slate-400">Pasien BPJS Hari Ini</p>
          <h2 className="mt-3 text-3xl font-bold text-white">{stats.total}</h2>
          <p className="mt-2 text-xs text-slate-500">Termasuk pasien rujukan FKTP.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/30 p-6 shadow-md">
          <p className="text-sm text-slate-400">Siap Dilayani</p>
          <h2 className="mt-3 text-3xl font-bold text-white">{stats.ready}</h2>
          <p className="mt-2 text-xs text-slate-500">Peserta aktif dan berkas siap.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/30 p-6 shadow-md">
          <p className="text-sm text-slate-400">Butuh Review</p>
          <h2 className="mt-3 text-3xl font-bold text-white">{stats.needsReview}</h2>
          <p className="mt-2 text-xs text-slate-500">Periksa rujukan atau kelengkapan berkas.</p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-6 shadow-lg">
          <h2 className="text-lg font-bold text-white">{editId ? "Edit Pasien BPJS" : "Tambah Pasien BPJS"}</h2>
          {error && (
            <div className="mt-4 rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Nama Pasien *</label>
              <input
                value={form.patient}
                onChange={(event) => setForm({ ...form, patient: event.target.value })}
                placeholder="Nama pasien BPJS"
                className="input"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">No. Kartu BPJS *</label>
              <input
                value={form.card}
                onChange={(event) => setForm({ ...form, card: event.target.value })}
                placeholder="0001234567890"
                className="input"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Poli Tujuan *</label>
              <select
                value={form.poly}
                onChange={(event) => setForm({ ...form, poly: event.target.value })}
                className="input"
              >
                {polyOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Status *</label>
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                className="input"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-200">Asal Rujukan *</label>
              <input
                value={form.referral}
                onChange={(event) => setForm({ ...form, referral: event.target.value })}
                placeholder="Contoh: FKTP Bugar Sentosa"
                className="input"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={submit} className="btn-primary">
              {editId ? "Perbarui" : "Simpan"}
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowForm(false)
              }}
              className="btn-secondary"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-4 shadow-md">
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-700/20">
              <th className="px-4 py-3">Pasien</th>
              <th className="px-4 py-3">No. Kartu</th>
              <th className="px-4 py-3">Poli</th>
              <th className="px-4 py-3">Rujukan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                <td className="px-4 py-3 font-medium text-white">{row.patient}</td>
                <td className="px-4 py-3">{row.card}</td>
                <td className="px-4 py-3">{row.poly}</td>
                <td className="px-4 py-3">{row.referral}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">{row.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => edit(row)} className="btn-secondary px-3 py-2 text-xs">
                      Edit
                    </button>
                    <button onClick={() => remove(row.id)} className="btn-ghost px-3 py-2 text-xs text-red-400 hover:bg-red-950/20 hover:text-red-300">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
