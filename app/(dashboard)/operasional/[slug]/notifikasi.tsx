"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

type Severity = "danger" | "warning" | "info"

type Notif = {
  id: string
  icon: string
  title: string
  description: string
  time: string
  severity: Severity
}

const SEVERITY_STYLE: Record<Severity, string> = {
  danger:  "border-red-500/30 bg-red-950/20 text-red-300",
  warning: "border-amber-500/30 bg-amber-950/20 text-amber-300",
  info:    "border-blue-500/30 bg-blue-950/20 text-blue-300",
}

const BADGE_STYLE: Record<Severity, string> = {
  danger:  "bg-red-500/20 text-red-300 border-red-500/30",
  warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  info:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
}

const SEVERITY_LABEL: Record<Severity, string> = {
  danger: "Kritis",
  warning: "Peringatan",
  info: "Info",
}

const READ_KEY = "xaviklinika_notif_read"

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")) } catch { return new Set() }
}

function markAllRead(ids: string[]) {
  try { localStorage.setItem(READ_KEY, JSON.stringify(ids)) } catch { /* noop */ }
}

export default function NotifikasiPage() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all")

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  useEffect(() => { setReadIds(getReadIds()) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    const collected: Notif[] = []

    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      // 1. Stok menipis
      try {
        const res = await fetch("/api/stock", { headers })
        const data = await res.json()
        if (data.success && Array.isArray(data.items)) {
          const low = (data.items as { id: string; name: string; stock: number; min_stock: number; unit: string }[]).filter(
            (i) => i.stock <= i.min_stock
          )
          if (low.length > 0) {
            collected.push({
              id: "stok-menipis",
              icon: "📦",
              title: "Stok Obat Menipis",
              description: `${low.length} item stok di bawah batas minimum: ${low.slice(0, 3).map((i) => i.name).join(", ")}${low.length > 3 ? ` dan ${low.length - 3} lainnya` : ""}.`,
              time: "Stok saat ini",
              severity: "warning",
            })
          }
        }
      } catch { /* skip if api unavailable */ }

      // 2. Piutang belum dibayar > 3 hari
      try {
        const res = await fetch("/api/bookings", { headers })
        const data = await res.json()
        if (data.success && Array.isArray(data.bookings)) {
          const cutoff = new Date()
          cutoff.setDate(cutoff.getDate() - 3)
          const overdue = (data.bookings as { id: string; payment_status: string; visit_date: string; patients?: { name: string } }[]).filter(
            (b) => b.payment_status === "pending" && new Date(b.visit_date) < cutoff
          )
          if (overdue.length > 0) {
            collected.push({
              id: "piutang-pending",
              icon: "💸",
              title: "Piutang Belum Dibayar",
              description: `${overdue.length} tagihan dengan status pending sudah lebih dari 3 hari. Segera tindak lanjuti.`,
              time: "Tagihan > 3 hari lalu",
              severity: "danger",
            })
          }
        }
      } catch { /* skip */ }

      // 3. Antrian menumpuk
      try {
        const today = new Date().toISOString().slice(0, 10)
        const res = await fetch(`/api/queue?date=${today}`, { headers })
        const data = await res.json()
        if (data.success) {
          const waiting = (data.queue ?? data.entries ?? []) as { status: string; type: string }[]
          const waitingPoli = waiting.filter((q) => q.status === "waiting" && q.type === "poli")
          if (waitingPoli.length > 10) {
            collected.push({
              id: "antrian-menumpuk",
              icon: "🏥",
              title: "Antrian Poli Menumpuk",
              description: `Ada ${waitingPoli.length} pasien dalam antrian poli yang masih menunggu hari ini.`,
              time: "Hari ini",
              severity: "warning",
            })
          }
        }
      } catch { /* skip */ }

      // 4. Trial akan habis
      try {
        const res = await fetch("/api/subscription", { headers })
        const data = await res.json()
        if (data.success && data.subscription) {
          const sub = data.subscription as { status: string; days_remaining: number }
          if (sub.status === "trialing" && sub.days_remaining <= 3) {
            collected.push({
              id: "trial-habis",
              icon: "⏰",
              title: "Masa Trial Akan Habis",
              description: `Masa trial Anda akan berakhir dalam ${sub.days_remaining} hari. Segera upgrade ke paket berbayar agar layanan tidak terganggu.`,
              time: `${sub.days_remaining} hari lagi`,
              severity: sub.days_remaining <= 1 ? "danger" : "warning",
            })
          }
        }
      } catch { /* skip */ }

      // 5. BPJS belum dipanggil hari ini
      try {
        const today = new Date().toISOString().slice(0, 10)
        const res = await fetch(`/api/bpjs?date=${today}`, { headers })
        const data = await res.json()
        if (data.success && Array.isArray(data.registrations)) {
          const pending = (data.registrations as { status: string }[]).filter((r) => r.status === "registered")
          if (pending.length > 0) {
            collected.push({
              id: "bpjs-pending",
              icon: "🏨",
              title: "Pasien BPJS Belum Dipanggil",
              description: `${pending.length} pendaftaran BPJS hari ini belum dipanggil/diproses.`,
              time: "Hari ini",
              severity: "info",
            })
          }
        }
      } catch { /* skip */ }

      if (collected.length === 0) {
        collected.push({
          id: "semua-baik",
          icon: "✅",
          title: "Semua Baik",
          description: "Tidak ada notifikasi penting saat ini. Klinik berjalan normal.",
          time: "Baru saja dicek",
          severity: "info",
        })
      }

      setNotifs(collected)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat notifikasi")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleMarkAllRead = () => {
    const ids = notifs.map((n) => n.id)
    markAllRead(ids)
    setReadIds(new Set(ids))
  }

  const filtered = notifs.filter((n) => {
    if (filter === "unread") return !readIds.has(n.id)
    if (filter === "critical") return n.severity === "danger"
    return true
  })

  const unreadCount = notifs.filter((n) => !readIds.has(n.id)).length
  const criticalCount = notifs.filter((n) => n.severity === "danger").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Operasional</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Notifikasi & Informasi Klinik</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleMarkAllRead} className="btn-secondary text-sm">Tandai Semua Dibaca</button>
          <button onClick={load} disabled={loading} className="btn-primary text-sm">{loading ? "Memuat..." : "↻ Refresh"}</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        <div className="rounded-2xl border border-slate-700/20 bg-slate-800/30 px-4 py-2 text-sm text-slate-300">
          <span className="font-semibold text-white">{notifs.length}</span> total
        </div>
        {unreadCount > 0 && (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 px-4 py-2 text-sm text-blue-300">
            <span className="font-semibold">{unreadCount}</span> belum dibaca
          </div>
        )}
        {criticalCount > 0 && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 px-4 py-2 text-sm text-red-300">
            <span className="font-semibold">{criticalCount}</span> kritis
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-700/20 bg-slate-900/40 p-1 w-fit">
        {(["all", "unread", "critical"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${filter === f ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"}`}>
            {f === "all" ? "Semua" : f === "unread" ? "Belum Dibaca" : "Kritis"}
          </button>
        ))}
      </div>

      {/* Notif list */}
      {loading ? (
        <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Mengecek data klinik...</div>
      ) : filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Tidak ada notifikasi di kategori ini</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const isRead = readIds.has(n.id)
            return (
              <div key={n.id}
                onClick={() => { const s = new Set(readIds); s.add(n.id); setReadIds(s); markAllRead([...s]) }}
                className={`relative cursor-pointer rounded-3xl border p-5 transition-all ${SEVERITY_STYLE[n.severity]} ${isRead ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{n.title}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${BADGE_STYLE[n.severity]}`}>
                        {SEVERITY_LABEL[n.severity]}
                      </span>
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-indigo-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="mt-1 text-sm opacity-80">{n.description}</p>
                    <p className="mt-1.5 text-xs opacity-50">{n.time}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-slate-600 text-center">Klik notifikasi untuk menandai sebagai dibaca. Data diambil langsung dari sistem.</p>
    </div>
  )
}
