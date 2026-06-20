"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"

type ByType = { queue_type: string; count: number; avg_wait_minutes: number }
type Summary = { avg_wait_loket: number; avg_wait_poli: number; avg_wait_apotek: number; total_served: number }

export default function LaporanSlaPage() {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [byType, setByType] = useState<ByType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async (m: string) => {
    setLoading(true)
    setError("")
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch(`/api/reports?type=sla&month=${m}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setSummary(data.summary)
      setByType(data.by_type)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(month) }, [month, load])

  const waitColor = (mins: number) => {
    if (mins === 0) return "text-slate-400"
    if (mins <= 15) return "text-emerald-300"
    if (mins <= 30) return "text-amber-300"
    return "text-red-300"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Laporan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Laporan SLA Waktu Tunggu</h1>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-auto" />
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Dilayani", value: loading ? "—" : String(summary?.total_served ?? 0), color: "text-white" },
          { label: "Rata-rata Loket", value: loading ? "—" : `${summary?.avg_wait_loket ?? 0} mnt`, color: waitColor(summary?.avg_wait_loket ?? 0) },
          { label: "Rata-rata Poli", value: loading ? "—" : `${summary?.avg_wait_poli ?? 0} mnt`, color: waitColor(summary?.avg_wait_poli ?? 0) },
          { label: "Rata-rata Apotek", value: loading ? "—" : `${summary?.avg_wait_apotek ?? 0} mnt`, color: waitColor(summary?.avg_wait_apotek ?? 0) },
        ].map((c) => (
          <div key={c.label} className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className={`mt-2 text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 p-5">
          <h2 className="font-semibold text-white">Breakdown per Tipe Antrian — {month}</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat...</div>
        ) : byType.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada data antrian</div>
        ) : (
          <div className="divide-y divide-slate-700/10">
            {byType.map((t) => (
              <div key={t.queue_type} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium capitalize text-white">{t.queue_type}</p>
                  <p className="text-xs text-slate-500">{t.count} antrian diproses</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${waitColor(t.avg_wait_minutes)}`}>{t.avg_wait_minutes}</p>
                  <p className="text-xs text-slate-400">menit rata-rata</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6">
        <h2 className="mb-3 font-semibold text-white">Keterangan SLA</h2>
        <div className="space-y-2 text-sm">
          {[
            { color: "bg-emerald-400", label: "≤ 15 menit — Baik" },
            { color: "bg-amber-400", label: "16–30 menit — Perlu Perhatian" },
            { color: "bg-red-400", label: "> 30 menit — Kritis" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${s.color}`} />
              <span className="text-slate-300">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
