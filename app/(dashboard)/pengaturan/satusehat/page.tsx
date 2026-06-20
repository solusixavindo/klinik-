"use client"

import { useEffect, useState } from "react"

type Stats = { pending: number; sent: number; failed: number }

type StatusInfo = {
  enabled: boolean
  org_id: string | null
  stats: Stats
  last_sync: string | null
  connection_status: string
}

type QueueItem = {
  id: string
  resource_type: string
  resource_id: string
  status: string
  attempts: number
  created_at: string
  last_error: string | null
  sent_at: string | null
}

type Settings = {
  satusehat_enabled: boolean
  satusehat_org_id: string
  satusehat_client_id: string
  satusehat_client_secret: string
}

function getConnectionLabel(status: string) {
  if (status === "configured") return { label: "Terhubung", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" }
  if (status === "demo") return { label: "Demo Mode", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" }
  return { label: "Belum Dikonfigurasi", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" }
}

function getStatusBadge(status: string) {
  if (status === "sent") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
  if (status === "failed") return "bg-red-500/20 text-red-300 border-red-500/30"
  if (status === "pending") return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
  return "bg-slate-500/20 text-slate-400 border-slate-500/30"
}

function getStatusLabel(status: string) {
  if (status === "sent") return "Terkirim"
  if (status === "failed") return "Gagal"
  if (status === "pending") return "Menunggu"
  if (status === "skipped") return "Dilewati"
  return status
}

export default function SatuSehatPage() {
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null)
  const [settings, setSettings] = useState<Settings>({
    satusehat_enabled: false,
    satusehat_org_id: "",
    satusehat_client_id: "",
    satusehat_client_secret: "",
  })
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [showSecret, setShowSecret] = useState(false)

  async function loadData() {
    const token = localStorage.getItem("sb-token") || sessionStorage.getItem("sb-token") || ""
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [statusRes, settingsRes] = await Promise.all([
        fetch("/api/satusehat", { headers }),
        fetch("/api/satusehat/settings", { headers }),
      ])
      const statusData = await statusRes.json() as StatusInfo
      const settingsData = await settingsRes.json() as { success: boolean; settings: Settings }
      setStatusInfo(statusData)
      if (settingsData.success) setSettings(settingsData.settings)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function loadQueue() {
    const token = localStorage.getItem("sb-token") || sessionStorage.getItem("sb-token") || ""
    try {
      // Queue tidak ada endpoint tersendiri, tampilkan dari status saja
      // Untuk tampilan demo kita kosongkan
      setQueue([])
    } catch {
      setQueue([])
    }
  }

  useEffect(() => {
    void loadData()
    void loadQueue()
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    const token = localStorage.getItem("sb-token") || sessionStorage.getItem("sb-token") || ""
    try {
      const res = await fetch("/api/satusehat/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      })
      const d = await res.json() as { success: boolean; message?: string; error?: string }
      setSaveMsg({ ok: d.success, text: d.success ? (d.message ?? "Tersimpan") : (d.error ?? "Gagal menyimpan") })
      if (d.success) await loadData()
    } catch {
      setSaveMsg({ ok: false, text: "Gagal menyimpan pengaturan" })
    } finally {
      setSaving(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    const token = localStorage.getItem("sb-token") || sessionStorage.getItem("sb-token") || ""
    try {
      const res = await fetch("/api/satusehat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      })
      const d = await res.json() as { success: boolean; message?: string; error?: string }
      setSyncMsg({ ok: d.success, text: d.success ? (d.message ?? "Sinkronisasi selesai") : (d.error ?? "Gagal sinkronisasi") })
      if (d.success) await loadData()
    } catch {
      setSyncMsg({ ok: false, text: "Gagal melakukan sinkronisasi" })
    } finally {
      setSyncing(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestMsg(null)
    const token = localStorage.getItem("sb-token") || sessionStorage.getItem("sb-token") || ""
    try {
      const res = await fetch("/api/satusehat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      })
      const d = await res.json() as { success: boolean; message?: string; mode?: string; error?: string }
      const isDemo = d.mode === "demo"
      setTestMsg({
        ok: d.success,
        text: d.success
          ? isDemo
            ? "Koneksi demo berhasil — mode simulasi aktif karena kredensial belum dikonfigurasi"
            : (d.message ?? "Koneksi berhasil!")
          : (d.error ?? "Koneksi gagal"),
      })
    } catch {
      setTestMsg({ ok: false, text: "Gagal menghubungi server" })
    } finally {
      setTesting(false)
    }
  }

  const conn = statusInfo ? getConnectionLabel(statusInfo.connection_status) : getConnectionLabel("not_configured")

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Memuat data SATU SEHAT...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Integrasi SATU SEHAT</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-600/30 text-green-300 border border-green-500/40">
              🏛️ Kemenkes RI
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">Sinkronisasi data kunjungan dengan platform digital Kemenkes</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${conn.color}`}>
            {conn.label}
          </span>
          <button
            onClick={() => void handleTest()}
            disabled={testing}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/15 text-white border border-white/10 transition disabled:opacity-50"
          >
            {testing ? "Menguji..." : "Test Koneksi"}
          </button>
        </div>
      </div>

      {testMsg && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${testMsg.ok ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-red-500/10 text-red-300 border-red-500/20"}`}>
          {testMsg.text}
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="text-blue-200 text-sm font-medium">Tentang SATU SEHAT</p>
            <p className="text-slate-400 text-sm mt-1">
              SATU SEHAT adalah platform digital Kemenkes RI yang wajib diintegrasikan oleh fasilitas kesehatan. Dengan integrasi ini, data kunjungan pasien akan otomatis dikirim ke platform nasional.
            </p>
            <a
              href="https://satusehat.kemkes.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block transition"
            >
              Daftar di satusehat.kemkes.go.id ↗
            </a>
          </div>
        </div>
      </div>

      {/* Konfigurasi */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4">
        <h2 className="text-white font-semibold text-base">Konfigurasi Integrasi</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Organization ID</label>
            <input
              type="text"
              value={settings.satusehat_org_id}
              onChange={(e) => setSettings((s) => ({ ...s, satusehat_org_id: e.target.value }))}
              placeholder="Contoh: 10000004"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <p className="text-slate-500 text-xs mt-1">ID organisasi dari portal SATU SEHAT</p>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Client ID</label>
            <input
              type="text"
              value={settings.satusehat_client_id}
              onChange={(e) => setSettings((s) => ({ ...s, satusehat_client_id: e.target.value }))}
              placeholder="Client ID dari aplikasi SATU SEHAT"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Client Secret</label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={settings.satusehat_client_secret}
                onChange={(e) => setSettings((s) => ({ ...s, satusehat_client_secret: e.target.value }))}
                placeholder="Client Secret dari aplikasi SATU SEHAT"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-10 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs transition"
              >
                {showSecret ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-1">Masukkan hanya jika ingin mengubah. Biarkan kosong untuk mempertahankan yang tersimpan.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={settings.satusehat_enabled}
            onClick={() => setSettings((s) => ({ ...s, satusehat_enabled: !s.satusehat_enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.satusehat_enabled ? "bg-emerald-600" : "bg-slate-600"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.satusehat_enabled ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
          <span className="text-slate-300 text-sm">Aktifkan integrasi SATU SEHAT</span>
        </div>

        {saveMsg && (
          <div className={`rounded-lg px-4 py-2.5 text-sm border ${saveMsg.ok ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-red-500/10 text-red-300 border-red-500/20"}`}>
            {saveMsg.text}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>

      {/* Antrian Sinkronisasi */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Antrian Sinkronisasi</h2>
          <button
            onClick={() => void handleSync()}
            disabled={syncing}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
          >
            {syncing ? "Menyinkronkan..." : "Sinkronisasi Sekarang"}
          </button>
        </div>

        {syncMsg && (
          <div className={`rounded-lg px-4 py-2.5 text-sm border ${syncMsg.ok ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-red-500/10 text-red-300 border-red-500/20"}`}>
            {syncMsg.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-center">
            <div className="text-2xl font-bold text-yellow-300">{statusInfo?.stats.pending ?? 0}</div>
            <div className="text-yellow-400/80 text-xs mt-0.5">Menunggu</div>
          </div>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-300">{statusInfo?.stats.sent ?? 0}</div>
            <div className="text-emerald-400/80 text-xs mt-0.5">Terkirim</div>
          </div>
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
            <div className="text-2xl font-bold text-red-300">{statusInfo?.stats.failed ?? 0}</div>
            <div className="text-red-400/80 text-xs mt-0.5">Gagal</div>
          </div>
        </div>

        {statusInfo?.last_sync && (
          <p className="text-slate-500 text-xs">
            Terakhir sinkron: {new Date(statusInfo.last_sync).toLocaleString("id-ID")}
          </p>
        )}

        {/* Queue Table */}
        {queue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs">
                  <th className="text-left py-2 pr-4 font-medium">Resource Type</th>
                  <th className="text-left py-2 pr-4 font-medium">ID</th>
                  <th className="text-left py-2 pr-4 font-medium">Status</th>
                  <th className="text-left py-2 pr-4 font-medium">Percobaan</th>
                  <th className="text-left py-2 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/3">
                    <td className="py-2 pr-4 text-white font-mono text-xs">{item.resource_type}</td>
                    <td className="py-2 pr-4 text-slate-400 font-mono text-xs truncate max-w-[120px]">{item.resource_id}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-400 text-xs">{item.attempts}x</td>
                    <td className="py-2 text-slate-400 text-xs">{new Date(item.created_at).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-sm">
            Belum ada item dalam antrian. Data kunjungan akan otomatis masuk ke antrian setelah fitur ini diaktifkan.
          </div>
        )}
      </div>

      {/* Panduan Setup */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4">
        <h2 className="text-white font-semibold text-base">Panduan Setup</h2>
        <ol className="space-y-3">
          {[
            { step: "1", title: "Daftar di Portal SATU SEHAT", desc: "Kunjungi satusehat.kemkes.go.id dan daftarkan fasilitas kesehatan Anda." },
            { step: "2", title: "Dapatkan Organization ID", desc: "Setelah verifikasi, catat Organization ID yang diberikan oleh Kemenkes." },
            { step: "3", title: "Buat Aplikasi di Portal", desc: "Buat aplikasi baru di portal SATU SEHAT untuk mendapatkan Client ID dan Client Secret." },
            { step: "4", title: "Masukkan Credentials di Sini", desc: "Isi formulir di atas dengan Organization ID, Client ID, dan Client Secret yang sudah didapat." },
          ].map((item) => (
            <li key={item.step} className="flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-300 text-xs font-bold">
                {item.step}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{item.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="pt-2">
          <a
            href="https://satusehat.kemkes.go.id/platform/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition"
          >
            Buka Dokumentasi SATU SEHAT ↗
          </a>
        </div>
      </div>
    </div>
  )
}
