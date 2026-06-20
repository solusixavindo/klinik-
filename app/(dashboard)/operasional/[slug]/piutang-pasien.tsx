"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"

type Booking = {
  id: string
  visit_date: string
  price: number
  payment_status: string
  notes: string | null
  patients: { name: string; phone?: string } | null
  doctors: { name: string } | null
}

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export default function PiutangPasienPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/bookings", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      // Hanya tampilkan yang belum lunas
      const unpaid = (data.bookings as Booking[]).filter((b) => b.payment_status !== "paid" && b.payment_status !== "cancelled")
      setBookings(unpaid)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const markPaid = async (id: string) => {
    const token = await getToken()
    const res = await fetch(`/api/bookings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, payment_status: "paid" }),
    })
    if (res.ok) load()
  }

  const filtered = bookings.filter((b) =>
    !search || b.patients?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPiutang = filtered.reduce((s, b) => s + Number(b.price), 0)
  const pending = filtered.filter((b) => b.payment_status === "pending").length
  const partial = filtered.filter((b) => b.payment_status === "partial").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Operasional</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Piutang Pasien</h1>
        </div>
        <button onClick={load} className="btn-secondary text-sm">↻ Refresh</button>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-xs text-slate-400">Total Piutang</p>
          <p className="mt-2 text-xl font-bold text-red-300">{fmt(totalPiutang)}</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-xs text-slate-400">Belum Bayar</p>
          <p className="mt-2 text-xl font-bold text-amber-300">{pending}</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-xs text-slate-400">Bayar Sebagian</p>
          <p className="mt-2 text-xl font-bold text-blue-300">{partial}</p>
        </div>
      </div>

      <input type="text" placeholder="Cari nama pasien..." value={search} onChange={(e) => setSearch(e.target.value)} className="input" />

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 p-5">
          <h2 className="font-semibold text-white">Tagihan Belum Lunas ({filtered.length})</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-emerald-500 text-sm">Tidak ada piutang — semua tagihan lunas!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/20 text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-5 py-3 text-left">Pasien</th>
                  <th className="px-5 py-3 text-left">Dokter</th>
                  <th className="px-5 py-3 text-left">Tanggal</th>
                  <th className="px-5 py-3 text-right">Tagihan</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{b.patients?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{b.patients?.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{b.doctors?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-400">{b.visit_date}</td>
                    <td className="px-5 py-3 text-right font-semibold text-white">{fmt(Number(b.price))}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        b.payment_status === "partial"
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      }`}>
                        {b.payment_status === "partial" ? "Sebagian" : "Belum Bayar"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => markPaid(b.id)}
                        className="rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-600/30">
                        Tandai Lunas
                      </button>
                    </td>
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
