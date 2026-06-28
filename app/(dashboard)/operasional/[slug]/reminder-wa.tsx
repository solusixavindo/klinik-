"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { ConfirmDialog } from "@/app/(dashboard)/_components/ConfirmDialog"

type BookingRow = {
  id: string
  visit_date: string
  patients: { name: string; phone: string } | null
  doctors: { name: string } | null
}

type ReminderLog = {
  id: string
  sent_at: string
  phone: string
  status: string
  error_message: string | null
  bookings: {
    id: string
    visit_date: string
    patients: { name: string } | null
  } | null
}

const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

export default function ReminderWaPage() {
  const [fonnteOk, setFonnteOk] = useState<boolean | null>(null)
  const [fonnteMsg, setFonnteMsg] = useState("")
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [logs, setLogs] = useState<ReminderLog[]>([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<"bookings" | "logs">("bookings")
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [pendingConfirm, setPendingConfirm] = useState<{ message: string; onOk: () => void } | null>(null)

  // Stats derived from today's logs
  const today = new Date().toISOString().split("T")[0]
  const todayLogs = logs.filter((l) => l.sent_at.startsWith(today))
  const todaySent = todayLogs.length
  const todayOk = todayLogs.filter((l) => l.status === "sent").length
  const todayFail = todayLogs.filter((l) => l.status === "failed").length

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const date = tomorrow.toISOString().split("T")[0]
      const res = await fetch(`/api/bookings?visit_date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setBookings(data.bookings ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/reminders/log", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setLogs(data.logs ?? [])
    } catch {
      // ignore
    } finally {
      setLogsLoading(false)
    }
  }, [])

  const checkFonnte = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch("/api/send-reminder", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 500) {
        const data = await res.json()
        if (data.error?.includes("FONNTE_TOKEN")) {
          setFonnteOk(false)
          setFonnteMsg("Token Fonnte belum dikonfigurasi, hubungi administrator")
          return
        }
      }
      setFonnteOk(true)
    } catch {
      setFonnteOk(false)
      setFonnteMsg("Gagal terhubung ke server reminder")
    }
  }, [])

  useEffect(() => {
    checkFonnte()
    loadBookings()
    loadLogs()
  }, [checkFonnte, loadBookings, loadLogs])

  const handleSendAll = () => {
    setPendingConfirm({
      message: `Kirim reminder WhatsApp ke ${bookings.length} pasien besok?`,
      onOk: async () => {
        setPendingConfirm(null)
        setSending(true)
        setError("")
        setSuccessMsg("")
        try {
          const token = await getToken()
          const res = await fetch("/api/send-reminder", {
            headers: { Authorization: `Bearer ${token}` },
          })
          const data = await res.json()
          if (!data.success && data.total === undefined) throw new Error(data.error)
          const ok = (data.results as { status: string }[] | undefined)?.filter((r) => r.status === "sent").length ?? 0
          const fail = (data.results as { status: string }[] | undefined)?.filter((r) => r.status === "failed").length ?? 0
          setSuccessMsg(`Selesai! Terkirim: ${ok}, Gagal: ${fail}`)
          loadLogs()
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Gagal kirim reminder")
        } finally {
          setSending(false)
        }
      },
    })
  }

  const handleSendSelected = () => {
    if (selected.size === 0) { setError("Pilih minimal satu pasien"); return }
    setPendingConfirm({
      message: `Kirim reminder WhatsApp ke ${selected.size} pasien terpilih?`,
      onOk: async () => {
        setPendingConfirm(null)
        setError("")
        setSuccessMsg("")
        let ok = 0; let fail = 0
        const ids = [...selected]
        for (const id of ids) {
          setSendingIds((prev) => new Set(prev).add(id))
          try {
            const token = await getToken()
            const res = await fetch("/api/send-reminder", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ booking_id: id }),
            })
            const data = await res.json()
            if (data.status === "sent") ok++; else fail++
          } catch {
            fail++
          } finally {
            setSendingIds((prev) => { const s = new Set(prev); s.delete(id); return s })
          }
        }
        setSelected(new Set())
        setSuccessMsg(`Selesai! Terkirim: ${ok}, Gagal: ${fail}`)
        loadLogs()
      },
    })
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })
  }

  const toggleAll = () => {
    if (selected.size === bookings.length) setSelected(new Set())
    else setSelected(new Set(bookings.map((b) => b.id)))
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

  return (
    <div className="space-y-6">
      {pendingConfirm && (
        <ConfirmDialog message={pendingConfirm.message} confirmLabel="Ya, Kirim" onConfirm={pendingConfirm.onOk} onCancel={() => setPendingConfirm(null)} />
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Operasional</p>
          <h1 className="mt-1 text-2xl font-bold text-white">WhatsApp Reminder</h1>
        </div>
        <button
          onClick={handleSendAll}
          disabled={sending || !fonnteOk || bookings.length === 0}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {sending ? "Mengirim..." : `💬 Kirim Reminder Besok (${bookings.length})`}
        </button>
      </div>

      {/* Fonnte status */}
      {fonnteOk === false && (
        <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">
          ⚠ {fonnteMsg}
        </div>
      )}
      {fonnteOk === true && (
        <div className="rounded-2xl border border-emerald-700/30 bg-emerald-950/20 p-4 text-sm text-emerald-300">
          ✓ Koneksi Fonnte aktif — siap mengirim reminder WhatsApp
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-2xl border border-emerald-700/30 bg-emerald-950/20 p-4 text-sm text-emerald-300">{successMsg}</div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Terkirim Hari Ini", value: todaySent, color: "text-indigo-300" },
          { label: "Berhasil", value: todayOk, color: "text-emerald-300" },
          { label: "Gagal", value: todayFail, color: "text-red-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-5">
            <p className="text-xs uppercase tracking-widest text-slate-500">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700/30 pb-0">
        {(["bookings", "logs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 px-4 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-indigo-500 text-indigo-300"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t === "bookings" ? `Booking Besok (${bookings.length})` : "Log Pengiriman"}
          </button>
        ))}
      </div>

      {/* Bookings Tab */}
      {tab === "bookings" && (
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
          <div className="border-b border-slate-700/20 p-5 flex items-center justify-between">
            <h2 className="font-semibold text-white">Pasien yang Akan Dikunjungi Besok</h2>
            {selected.size > 0 && (
              <button onClick={handleSendSelected} className="btn-primary text-sm">
                Kirim ke {selected.size} Terpilih
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
          ) : bookings.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Tidak ada booking untuk besok</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/20 text-xs uppercase tracking-widest text-slate-500">
                    <th className="px-5 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selected.size === bookings.length && bookings.length > 0}
                        onChange={toggleAll}
                        className="accent-indigo-500"
                      />
                    </th>
                    <th className="px-5 py-3 text-left">Pasien</th>
                    <th className="px-5 py-3 text-left">No HP</th>
                    <th className="px-5 py-3 text-left">Dokter</th>
                    <th className="px-5 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const isSending = sendingIds.has(b.id)
                    return (
                      <tr key={b.id} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(b.id)}
                            onChange={() => toggleSelect(b.id)}
                            className="accent-indigo-500"
                          />
                        </td>
                        <td className="px-5 py-3 font-medium text-white">{b.patients?.name ?? "-"}</td>
                        <td className="px-5 py-3 text-slate-400">{b.patients?.phone ?? "-"}</td>
                        <td className="px-5 py-3 text-slate-400">{b.doctors?.name ?? "-"}</td>
                        <td className="px-5 py-3 text-center">
                          <button
                            disabled={isSending || !fonnteOk}
                            onClick={async () => {
                              setSendingIds((prev) => new Set(prev).add(b.id))
                              try {
                                const token = await getToken()
                                await fetch("/api/send-reminder", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ booking_id: b.id }),
                                })
                                loadLogs()
                              } finally {
                                setSendingIds((prev) => { const s = new Set(prev); s.delete(b.id); return s })
                              }
                            }}
                            className="rounded-lg border border-indigo-500/30 bg-indigo-950/30 px-3 py-1 text-xs text-indigo-300 hover:bg-indigo-900/40 disabled:opacity-40"
                          >
                            {isSending ? "Mengirim..." : "Kirim"}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {tab === "logs" && (
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
          <div className="border-b border-slate-700/20 p-5">
            <h2 className="font-semibold text-white">Log Pengiriman (30 Hari Terakhir)</h2>
          </div>
          {logsLoading ? (
            <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat log...</div>
          ) : logs.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada log pengiriman</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/20 text-xs uppercase tracking-widest text-slate-500">
                    <th className="px-5 py-3 text-left">Tanggal</th>
                    <th className="px-5 py-3 text-left">Pasien</th>
                    <th className="px-5 py-3 text-left">No HP</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-left">Pesan Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                      <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{fmtDate(log.sent_at)}</td>
                      <td className="px-5 py-3 text-white">
                        {log.bookings?.patients?.name ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-slate-400">{log.phone}</td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            log.status === "sent"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {log.status === "sent" ? "Berhasil" : "Gagal"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{log.error_message ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
