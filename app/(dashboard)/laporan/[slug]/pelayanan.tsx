"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import ExportButton from "@/app/(dashboard)/_components/ExportButton"

type DoctorStat = { name: string; specialization: string; visits: number; with_records: number }
type Summary = { total_visits: number; with_records: number; without_records: number }

export default function LaporanPelayananPage() {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [byDoctor, setByDoctor] = useState<DoctorStat[]>([])
  const [coverage, setCoverage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async (m: string) => {
    setLoading(true)
    setError("")
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch(`/api/reports?type=service&month=${m}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setSummary(data.summary)
      setByDoctor(data.by_doctor)
      setCoverage(data.records_coverage_pct)
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
          <h1 className="mt-1 text-2xl font-bold text-white">Laporan Pelayanan</h1>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-auto" />
          <ExportButton type="service" month={month} />
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Kunjungan", value: loading ? "—" : String(summary?.total_visits ?? 0), color: "text-white" },
          { label: "Ada Rekam Medis", value: loading ? "—" : String(summary?.with_records ?? 0), color: "text-emerald-300" },
          { label: "Tanpa Rekam Medis", value: loading ? "—" : String(summary?.without_records ?? 0), color: "text-amber-300" },
          { label: "Rekam Medis Coverage", value: loading ? "—" : `${coverage}%`, color: coverage >= 80 ? "text-emerald-300" : "text-amber-300" },
        ].map((c) => (
          <div key={c.label} className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className={`mt-2 text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 p-5">
          <h2 className="font-semibold text-white">Kunjungan per Dokter — {month}</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat...</div>
        ) : byDoctor.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/20">
                  <th className="px-5 py-3 text-left text-slate-400 font-medium">Dokter</th>
                  <th className="px-5 py-3 text-left text-slate-400 font-medium">Spesialisasi</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Kunjungan</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Rekam Medis</th>
                  <th className="px-5 py-3 text-right text-slate-400 font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/10">
                {byDoctor.map((d) => {
                  const cov = d.visits > 0 ? Math.round((d.with_records / d.visits) * 100) : 0
                  return (
                    <tr key={d.name} className="hover:bg-slate-800/20">
                      <td className="px-5 py-3 font-medium text-white">{d.name}</td>
                      <td className="px-5 py-3 text-slate-400">{d.specialization}</td>
                      <td className="px-5 py-3 text-right text-indigo-300 font-semibold">{d.visits}</td>
                      <td className="px-5 py-3 text-right text-emerald-300">{d.with_records}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={cov >= 80 ? "text-emerald-300" : "text-amber-300"}>{cov}%</span>
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
