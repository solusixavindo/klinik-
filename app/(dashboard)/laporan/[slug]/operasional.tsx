"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import ExportButton from "@/app/(dashboard)/_components/ExportButton"

type DoctorStat = { name: string; specialization: string; bookings: number; revenue: number }
type VisitType = { regular: number; bpjs: number; emergency: number }
type Summary = { total_bookings: number; new_patients: number; total_doctors: number; total_revenue: number }

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export default function LaporanOperasionalPage() {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [byDoctor, setByDoctor] = useState<DoctorStat[]>([])
  const [byType, setByType] = useState<VisitType>({ regular: 0, bpjs: 0, emergency: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async (m: string) => {
    setLoading(true)
    setError("")
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch(`/api/reports?type=operational&month=${m}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setSummary(data.summary)
      setByDoctor(data.by_doctor)
      setByType(data.by_visit_type)
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
          <h1 className="mt-1 text-2xl font-bold text-white">Laporan Operasional</h1>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-auto" />
          <ExportButton type="operational" month={month} />
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Kunjungan", value: loading ? "—" : String(summary?.total_bookings ?? 0) },
          { label: "Pasien Baru", value: loading ? "—" : String(summary?.new_patients ?? 0) },
          { label: "Total Dokter", value: loading ? "—" : String(summary?.total_doctors ?? 0) },
          { label: "Total Pendapatan", value: loading ? "—" : fmt(summary?.total_revenue ?? 0) },
        ].map((c) => (
          <div key={c.label} className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className="mt-2 text-xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kunjungan per dokter */}
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
          <div className="border-b border-slate-700/20 p-5">
            <h2 className="font-semibold text-white">Kunjungan per Dokter</h2>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat...</div>
          ) : byDoctor.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada data</div>
          ) : (
            <div className="divide-y divide-slate-700/10">
              {byDoctor.map((d) => (
                <div key={d.name} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-medium text-white">{d.name}</p>
                    <p className="text-xs text-slate-500">{d.specialization}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-indigo-300">{d.bookings} kunjungan</p>
                    <p className="text-xs text-slate-400">{fmt(d.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tipe kunjungan */}
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6">
          <h2 className="mb-4 font-semibold text-white">Tipe Kunjungan</h2>
          {loading ? (
            <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat...</div>
          ) : (
            <div className="space-y-4">
              {[
                { key: "regular", label: "Pasien Umum", color: "bg-indigo-500" },
                { key: "bpjs", label: "BPJS", color: "bg-emerald-500" },
                { key: "emergency", label: "Darurat", color: "bg-red-500" },
              ].map(({ key, label, color }) => {
                const val = byType[key as keyof VisitType]
                const total = byType.regular + byType.bpjs + byType.emergency
                const pct = total > 0 ? Math.round((val / total) * 100) : 0
                return (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-300">{label}</span>
                      <span className="text-slate-400">{val} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700/40">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
