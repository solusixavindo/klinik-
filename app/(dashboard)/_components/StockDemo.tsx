"use client"

import { useMemo, useState } from "react"

type StockItem = {
  name: string
  remaining: number
  threshold: number
}

type RequestItem = {
  id: string
  medicine: string
  quantity: number
  priority: string
  note: string
  status: string
}

const stockItems: StockItem[] = [
  { name: "Amoxicillin", remaining: 18, threshold: 20 },
  { name: "Paracetamol", remaining: 55, threshold: 30 },
  { name: "Vitamin C", remaining: 12, threshold: 15 },
  { name: "Syrup Demam", remaining: 9, threshold: 10 },
]

const initialRequests: RequestItem[] = [
  { id: "req-1", medicine: "Amoxicillin", quantity: 40, priority: "Tinggi", note: "Stok di bawah ambang", status: "Diproses" },
  { id: "req-2", medicine: "Vitamin C", quantity: 30, priority: "Sedang", note: "Persiapan kebutuhan mingguan", status: "Menunggu Approval" },
]

const initialForm = {
  medicine: stockItems[0].name,
  quantity: "20",
  priority: "Sedang",
  note: "",
}

export default function StockDemo() {
  const [requests, setRequests] = useState(initialRequests)
  const [form, setForm] = useState(initialForm)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")

  const lowStockCount = useMemo(
    () => stockItems.filter((item) => item.remaining <= item.threshold).length,
    []
  )

  const submit = () => {
    const quantity = Number(form.quantity)

    if (!form.medicine || !Number.isFinite(quantity) || quantity <= 0) {
      setError("Pilih obat dan isi jumlah permintaan dengan angka positif")
      return
    }

    setRequests((current) => [
      {
        id: `req-${Date.now()}`,
        medicine: form.medicine,
        quantity,
        priority: form.priority,
        note: form.note.trim() || "Permintaan restock dari dashboard",
        status: "Menunggu Approval",
      },
      ...current,
    ])
    setForm(initialForm)
    setError("")
    setShowForm(false)
  }

  const approve = (id: string) => {
    setRequests((current) =>
      current.map((item) => item.id === id ? { ...item, status: "Diproses" } : item)
    )
  }

  const remove = (id: string) => {
    if (!confirm("Hapus permintaan stok ini?")) return
    setRequests((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Operasional</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Stok Obat</h1>
          <p className="mt-2 max-w-2xl text-slate-400">Pantau ketersediaan obat dan kebutuhan reorder untuk apotek klinik.</p>
        </div>
        <button
          onClick={() => {
            setShowForm((value) => !value)
            setError("")
          }}
          className="btn-secondary"
        >
          {showForm ? "Tutup Form" : "Buat Permintaan"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Total Obat</p>
          <h2 className="mt-3 text-4xl font-bold text-white">{stockItems.length}</h2>
          <p className="mt-2 text-xs text-slate-500">Jumlah item dalam inventaris demo.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Stock Rendah</p>
          <h2 className="mt-3 text-4xl font-bold text-white">{lowStockCount}</h2>
          <p className="mt-2 text-xs text-slate-500">Item perlu restock segera.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Permintaan Diproses</p>
          <h2 className="mt-3 text-4xl font-bold text-white">{requests.length}</h2>
          <p className="mt-2 text-xs text-slate-500">Permintaan obat sedang aktif.</p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-6 shadow-lg">
          <h2 className="text-lg font-bold text-white">Buat Permintaan Stok</h2>
          {error && (
            <div className="mt-4 rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Nama Obat *</label>
              <select
                value={form.medicine}
                onChange={(event) => setForm({ ...form, medicine: event.target.value })}
                className="input"
              >
                {stockItems.map((item) => (
                  <option key={item.name} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Jumlah *</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Prioritas</label>
              <select
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value })}
                className="input"
              >
                <option value="Rendah">Rendah</option>
                <option value="Sedang">Sedang</option>
                <option value="Tinggi">Tinggi</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Catatan</label>
              <input
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                placeholder="Contoh: kebutuhan apotek minggu ini"
                className="input"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={submit} className="btn-primary">Simpan Permintaan</button>
            <button
              onClick={() => {
                setShowForm(false)
                setForm(initialForm)
                setError("")
              }}
              className="btn-secondary"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-4 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-white">Daftar Stok</h2>
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-700/20">
              <th className="px-4 py-3">Nama Obat</th>
              <th className="px-4 py-3">Sisa</th>
              <th className="px-4 py-3">Ambang</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {stockItems.map((item) => (
              <tr key={item.name} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                <td className="px-4 py-3">{item.remaining}</td>
                <td className="px-4 py-3">{item.threshold}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.remaining <= item.threshold
                      ? "bg-rose-500/10 text-rose-300"
                      : "bg-emerald-500/10 text-emerald-300"
                  }`}>
                    {item.remaining <= item.threshold ? "Rendah" : "Aman"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-4 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-white">Permintaan Stok</h2>
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-700/20">
              <th className="px-4 py-3">Obat</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Prioritas</th>
              <th className="px-4 py-3">Catatan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((item) => (
              <tr key={item.id} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                <td className="px-4 py-3 font-medium text-white">{item.medicine}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{item.priority}</td>
                <td className="px-4 py-3">{item.note}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">{item.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {item.status !== "Diproses" && (
                      <button onClick={() => approve(item.id)} className="btn-secondary px-3 py-2 text-xs">
                        Proses
                      </button>
                    )}
                    <button onClick={() => remove(item.id)} className="btn-ghost px-3 py-2 text-xs text-red-400 hover:bg-red-950/20 hover:text-red-300">
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
