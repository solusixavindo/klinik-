"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"
import ExportButton from "@/app/(dashboard)/_components/ExportButton"

type Trend = { month: string; revenue: number; estimated_cost: number; gross_profit: number }
type Summary = { revenue: number; estimated_cost: number; gross_profit: number; gross_margin_pct: number }

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`
const shortMonth = (m: string) => {
  const [, mm] = m.split("-")
  const names = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]
  return names[parseInt(mm, 10) - 1] ?? m
}

export default function LaporanLabaRugiPage() {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [trend, setTrend] = useState<Trend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async (m: string) => {
    setLoading(true)
    setError("")
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch(`/api/reports?type=profit_loss&month=${m}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setSummary(data.summary)
      setTrend(data.monthly_trend)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(month) }, [month, load])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Laporan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Laporan Laba Rugi</h1>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-auto" />
          <ExportButton type="profit_loss" month={month} />
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Pendapatan", value: loading ? "—" : fmt(summary?.revenue ?? 0), color: "text-emerald-300" },
          { label: "Estimasi HPP (40%)", value: loading ? "—" : fmt(summary?.estimated_cost ?? 0), color: "text-red-300" },
          { label: "Laba Kotor", value: loading ? "—" : fmt(summary?.gross_profit ?? 0), color: (summary?.gross_profit ?? 0) >= 0 ? "text-emerald-300" : "text-red-300" },
          { label: "Margin Kotor", value: loading ? "—" : `${summary?.gross_margin_pct ?? 0}%`, color: (summary?.gross_margin_pct ?? 0) >= 50 ? "text-emerald-300" : "text-amber-300" },
        ].map((c) => (
          <div key={c.label} className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className={`mt-2 text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6">
        <h2 className="mb-4 font-semibold text-white">Tren 6 Bulan Terakhir</h2>
        {loading ? (
          <div className="flex h-48 items-center justify-center text-slate-400 text-sm">Memuat grafik...</div>
        ) : trend.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-slate-500 text-sm">Tidak ada data</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tickFormatter={shortMonth} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                formatter={(v) => fmt(Number(v))}
                labelFormatter={(l) => `Bulan ${l}`}
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" name="Pendapatan" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="estimated_cost" name="Est. HPP" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="gross_profit" name="Laba Kotor" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {!loading && trend.length > 0 && (
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
          <div className="border-b border-slate-700/20 p-5">
            <h2 className="font-semibold text-white">Rincian per Bulan</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/20">
                  <th className="px-5 py-3 text-left text-slate-400 font-medium">Bulan</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Pendapatan</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Est. HPP</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Laba Kotor</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/10">
                {trend.map((t) => {
                  const margin = t.revenue > 0 ? Math.round((t.gross_profit / t.revenue) * 100) : 0
                  return (
                    <tr key={t.month} className="hover:bg-slate-800/20">
                      <td className="px-5 py-3 text-slate-300">{t.month}</td>
                      <td className="px-5 py-3 text-right text-emerald-300">{fmt(t.revenue)}</td>
                      <td className="px-5 py-3 text-right text-red-300">{fmt(t.estimated_cost)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-white">{fmt(t.gross_profit)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={margin >= 50 ? "text-emerald-300" : "text-amber-300"}>{margin}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
