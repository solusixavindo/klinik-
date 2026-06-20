"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import ExportButton from "@/app/(dashboard)/_components/ExportButton"

type DailyData = { date: string; total: number; bpjs: number; regular: number }
type Summary = { total_patients: number; bpjs_patients: number; regular_patients: number }

const shortDate = (d: string) => d.slice(8)

export default function LaporanPendaftaranPage() {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [daily, setDaily] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async (m: string) => {
    setLoading(true)
    setError("")
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch(`/api/reports?type=registration&month=${m}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setSummary(data.summary)
      setDaily(data.daily_data)
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
          <h1 className="mt-1 text-2xl font-bold text-white">Laporan Pendaftaran Pasien</h1>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-auto" />
          <ExportButton type="registration" month={month} />
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          { label: "Total Pasien Baru", value: loading ? "—" : String(summary?.total_patients ?? 0), color: "text-white" },
          { label: "Pasien BPJS", value: loading ? "—" : String(summary?.bpjs_patients ?? 0), color: "text-emerald-300" },
          { label: "Pasien Umum", value: loading ? "—" : String(summary?.regular_patients ?? 0), color: "text-indigo-300" },
        ].map((c) => (
          <div key={c.label} className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className={`mt-2 text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6">
        <h2 className="mb-4 font-semibold text-white">Pendaftaran Harian — {month}</h2>
        {loading ? (
          <div className="flex h-48 items-center justify-center text-slate-400 text-sm">Memuat grafik...</div>
        ) : daily.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-slate-500 text-sm">Tidak ada data bulan ini</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={daily} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                formatter={(v) => [String(Number(v)), ""]}
                labelFormatter={(l) => `Tanggal ${l}`}
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bpjs" name="BPJS" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="regular" name="Umum" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {!loading && daily.length > 0 && (
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
          <div className="border-b border-slate-700/20 p-5">
            <h2 className="font-semibold text-white">Detail Harian</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/20">
                  <th className="px-5 py-3 text-left text-slate-400 font-medium">Tanggal</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Total</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">BPJS</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Umum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/10">
                {daily.map((d) => (
                  <tr key={d.date} className="hover:bg-slate-800/20">
                    <td className="px-5 py-3 text-slate-300">{d.date}</td>
                    <td className="px-5 py-3 text-right text-white font-medium">{d.total}</td>
                    <td className="px-5 py-3 text-right text-emerald-300">{d.bpjs}</td>
                    <td className="px-5 py-3 text-right text-indigo-300">{d.regular}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
