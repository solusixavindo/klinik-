"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { ConfirmDialog } from "@/app/(dashboard)/_components/ConfirmDialog"

type StockItem = {
  id: string
  name: string
  category: string
  unit: string
  stock: number
  min_stock: number
  buy_price: number
  sell_price: number
  description: string | null
  updated_at: string
}

const emptyForm = { name: "", category: "obat", unit: "pcs", stock: "", min_stock: "10", buy_price: "", sell_price: "", description: "" }
const CATEGORIES = ["obat", "alat medis", "suplemen", "vaksin", "lainnya"]
const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export default function StokObatPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [adjustVal, setAdjustVal] = useState("")
  const [lowStockCount, setLowStockCount] = useState(0)
  const [pendingConfirm, setPendingConfirm] = useState<{ message: string; onOk: () => void } | null>(null)

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/stock", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setItems(data.items)
      setLowStockCount(data.low_stock_count)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data stok")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Nama item wajib diisi"); return }
    setSaving(true)
    setError("")
    try {
      const token = await getToken()
      const method = editId ? "PATCH" : "POST"
      const body = editId ? { id: editId, ...form, stock: Number(form.stock), min_stock: Number(form.min_stock), buy_price: Number(form.buy_price), sell_price: Number(form.sell_price) }
        : { ...form, stock: Number(form.stock), min_stock: Number(form.min_stock), buy_price: Number(form.buy_price), sell_price: Number(form.sell_price) }
      const res = await fetch("/api/stock", {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setShowForm(false)
      setForm(emptyForm)
      setEditId(null)
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: StockItem) => {
    setForm({ name: item.name, category: item.category, unit: item.unit, stock: String(item.stock), min_stock: String(item.min_stock), buy_price: String(item.buy_price), sell_price: String(item.sell_price), description: item.description ?? "" })
    setEditId(item.id)
    setShowForm(true)
    setAdjustId(null)
    setError("")
  }

  const handleDelete = (id: string) => {
    setPendingConfirm({
      message: "Hapus item ini dari stok?",
      onOk: async () => {
        setPendingConfirm(null)
        const token = await getToken()
        await fetch(`/api/stock?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
        load()
      },
    })
  }

  const handleAdjust = async (id: string) => {
    const val = parseInt(adjustVal)
    if (isNaN(val)) { setError("Masukkan angka yang valid"); return }
    const token = await getToken()
    const res = await fetch("/api/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, stock_change: val }),
    })
    const data = await res.json()
    if (data.success) { setAdjustId(null); setAdjustVal(""); load() }
    else setError(data.error)
  }

  const f = (v: string, k: string) => setForm((p) => ({ ...p, [k]: v }))

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      {pendingConfirm && (
        <ConfirmDialog message={pendingConfirm.message} confirmLabel="Ya, Hapus" danger onConfirm={pendingConfirm.onOk} onCancel={() => setPendingConfirm(null)} />
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Operasional</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Stok Obat & Alat Medis</h1>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setError("") }} className="btn-primary text-sm">
          + Tambah Item
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      {lowStockCount > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-300">
          ⚠ {lowStockCount} item stok menipis (di bawah batas minimum). Segera lakukan pembelian.
        </div>
      )}

      <div className="flex gap-3">
        <input type="text" placeholder="Cari nama atau kategori..." value={search} onChange={(e) => setSearch(e.target.value)} className="input flex-1" />
      </div>

      {showForm && (
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">{editId ? "Edit Item" : "Tambah Item Baru"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Nama</label>
              <input type="text" value={form.name} onChange={(e) => f(e.target.value, "name")} className="input" placeholder="Amoxicillin 500mg" />
            </div>
            <div>
              <label className="label">Kategori</label>
              <select value={form.category} onChange={(e) => f(e.target.value, "category")} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Satuan</label>
              <input type="text" value={form.unit} onChange={(e) => f(e.target.value, "unit")} className="input" placeholder="strip, botol, pcs..." />
            </div>
            <div>
              <label className="label">Stok Awal</label>
              <input type="number" value={form.stock} onChange={(e) => f(e.target.value, "stock")} className="input" />
            </div>
            <div>
              <label className="label">Stok Minimum (alert)</label>
              <input type="number" value={form.min_stock} onChange={(e) => f(e.target.value, "min_stock")} className="input" />
            </div>
            <div>
              <label className="label">Harga Beli</label>
              <input type="number" value={form.buy_price} onChange={(e) => f(e.target.value, "buy_price")} className="input" placeholder="0" />
            </div>
            <div>
              <label className="label">Harga Jual</label>
              <input type="number" value={form.sell_price} onChange={(e) => f(e.target.value, "sell_price")} className="input" placeholder="0" />
            </div>
            <div>
              <label className="label">Deskripsi</label>
              <input type="text" value={form.description} onChange={(e) => f(e.target.value, "description")} className="input" placeholder="Opsional..." />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? "Menyimpan..." : "Simpan"}</button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 p-5">
          <h2 className="font-semibold text-white">Daftar Stok ({filtered.length})</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada item stok</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/20 text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-5 py-3 text-left">Nama</th>
                  <th className="px-5 py-3 text-left">Kategori</th>
                  <th className="px-5 py-3 text-center">Stok</th>
                  <th className="px-5 py-3 text-right">Harga Jual</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const low = item.stock <= item.min_stock
                  return (
                    <tr key={item.id} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                      <td className="px-5 py-3">
                        <p className="font-medium text-white">{item.name}</p>
                        {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                      </td>
                      <td className="px-5 py-3 capitalize text-slate-400">{item.category}</td>
                      <td className="px-5 py-3 text-center">
                        {adjustId === item.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <input type="number" value={adjustVal} onChange={(e) => setAdjustVal(e.target.value)}
                              className="input w-20 py-1 text-sm text-center" placeholder="±" />
                            <button onClick={() => handleAdjust(item.id)} className="rounded-lg bg-indigo-600/30 border border-indigo-500/30 px-2 py-1 text-xs text-indigo-300">OK</button>
                            <button onClick={() => setAdjustId(null)} className="text-slate-500 text-xs">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => { setAdjustId(item.id); setAdjustVal("") }}
                            className={`rounded-lg px-3 py-1 text-sm font-semibold ${low ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-slate-700/30 text-slate-200"}`}>
                            {item.stock} {item.unit}
                            {low && " ⚠"}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-200">{fmt(item.sell_price)}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(item)} className="rounded-lg border border-slate-600/30 bg-slate-700/30 px-3 py-1 text-xs text-slate-300 hover:bg-slate-600/40">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="rounded-lg border border-red-700/30 bg-red-950/30 px-3 py-1 text-xs text-red-300 hover:bg-red-900/40">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
