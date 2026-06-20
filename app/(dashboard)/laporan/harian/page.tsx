"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import ExportButton from "@/app/(dashboard)/_components/ExportButton"

type Booking = {
  id: string
  visit_date: string
  price: number
  payment_status: string
  visit_type: string
  notes: string | null
  patients: { name: string; phone: string } | null
  doctors: { name: string; specialization: string } | null
}

type Summary = {
  total_bookings: number
  total_revenue: number
  paid_revenue: number
  pending_revenue: number
}

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export default function LaporanHarianPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [summary, setSummary] = useState<Summary | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async (d: string) => {
    setLoading(true)
    setError("")
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch(`/api/reports?type=daily&date=${d}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setSummary(data.summary)
      setBookings(data.bookings)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(date) }, [date, load])

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      partial: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
    }
    const label: Record<string, string> = { paid: "Lunas", pending: "Belum Bayar", partial: "Sebagian", cancelled: "Batal" }
    return (
      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[s] ?? "bg-slate-700/30 text-slate-400 border-slate-600/30"}`}>
        {label[s] ?? s}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Laporan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Laporan Harian</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-auto"
          />
          <ExportButton type="daily" date={date} />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Kunjungan", value: loading ? "—" : String(summary?.total_bookings ?? 0), accent: "text-white" },
          { label: "Total Tagihan", value: loading ? "—" : fmt(summary?.total_revenue ?? 0), accent: "text-white" },
          { label: "Sudah Lunas", value: loading ? "—" : fmt(summary?.paid_revenue ?? 0), accent: "text-emerald-300" },
          { label: "Belum Bayar", value: loading ? "—" : fmt(summary?.pending_revenue ?? 0), accent: "text-amber-300" },
        ].map((c) => (
          <div key={c.label} className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className={`mt-2 text-xl font-bold ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="p-5 border-b border-slate-700/20">
          <h2 className="font-semibold text-white">Detail Kunjungan — {date}</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
        ) : bookings.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Tidak ada kunjungan pada tanggal ini</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/20 text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Pasien</th>
                  <th className="px-5 py-3 text-left">Dokter</th>
                  <th className="px-5 py-3 text-left">Tipe</th>
                  <th className="px-5 py-3 text-right">Tagihan</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={b.id} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                    <td className="px-5 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{b.patients?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{b.patients?.phone ?? ""}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-200">{b.doctors?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{b.doctors?.specialization ?? ""}</p>
                    </td>
                    <td className="px-5 py-3 capitalize text-slate-400">{b.visit_type ?? "regular"}</td>
                    <td className="px-5 py-3 text-right font-semibold text-white">{fmt(Number(b.price))}</td>
                    <td className="px-5 py-3 text-center">{statusBadge(b.payment_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
