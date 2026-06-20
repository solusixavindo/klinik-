"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import ExportButton from "@/app/(dashboard)/_components/ExportButton"

type StockItem = {
  id: string
  name: string
  category: string
  stock: number
  unit: string
  buy_price: number
  sell_price: number
  min_stock: number
}
type Summary = { total_items: number; total_stock_value: number; low_stock_items: number }

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export default function LaporanFarmasiPage() {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const load = useCallback(async (m: string) => {
    setLoading(true)
    setError("")
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch(`/api/reports?type=pharmacy&month=${m}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setSummary(data.summary)
      setItems(data.items)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(month) }, [month, load])

  const filtered = items.filter((i) =>
    search === "" || i.name.toLowerCase().includes(search.toLowerCase()) || (i.category || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Laporan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Laporan Penjualan Farmasi</h1>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-auto" />
          <ExportButton type="pharmacy" month={month} />
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          { label: "Total Item", value: loading ? "—" : String(summary?.total_items ?? 0), color: "text-white" },
          { label: "Nilai Stok", value: loading ? "—" : fmt(summary?.total_stock_value ?? 0), color: "text-emerald-300" },
          { label: "Stok Menipis", value: loading ? "—" : String(summary?.low_stock_items ?? 0), color: (summary?.low_stock_items ?? 0) > 0 ? "text-red-300" : "text-emerald-300" },
        ].map((c) => (
          <div key={c.label} className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className={`mt-2 text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-700/20 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-white">Daftar Stok Obat &amp; Farmasi</h2>
          <input
            type="text"
            placeholder="Cari nama atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full sm:w-64"
          />
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Tidak ada item ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/20">
                  <th className="px-5 py-3 text-left text-slate-400 font-medium">Nama</th>
                  <th className="px-5 py-3 text-left text-slate-400 font-medium">Kategori</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Stok</th>
                  <th className="px-5 py-3 text-left text-slate-400 font-medium">Satuan</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Harga Beli</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Harga Jual</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Nilai Stok</th>
                  <th className="px-5 py-3 text-center text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/10">
                {filtered.map((item) => {
                  const stockValue = Number(item.stock || 0) * Number(item.sell_price || 0)
                  const isLow = Number(item.stock || 0) <= Number(item.min_stock || 0)
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="px-5 py-3 font-medium text-white">{item.name}</td>
                      <td className="px-5 py-3 text-slate-400">{item.category || "-"}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${isLow ? "text-red-300" : "text-white"}`}>{item.stock}</td>
                      <td className="px-5 py-3 text-slate-400">{item.unit || "-"}</td>
                      <td className="px-5 py-3 text-right text-slate-400">{fmt(Number(item.buy_price || 0))}</td>
                      <td className="px-5 py-3 text-right text-slate-300">{fmt(Number(item.sell_price || 0))}</td>
                      <td className="px-5 py-3 text-right text-emerald-300">{fmt(stockValue)}</td>
                      <td className="px-5 py-3 text-center">
                        {isLow ? (
                          <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-xs text-red-300">Menipis</span>
                        ) : (
                          <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-300">Normal</span>
                        )}
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
