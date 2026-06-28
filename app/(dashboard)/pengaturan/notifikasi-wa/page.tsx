"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const TEMPLATES = [
  {
    key: "bookingConfirm",
    title: "Konfirmasi Booking",
    trigger: "Dikirim otomatis saat booking baru berhasil dibuat",
    preview: `Halo [Nama Pasien] 👋\n\nBooking Anda telah *dikonfirmasi*:\n🏥 [Nama Klinik]\n👨‍⚕️ Dokter: [Nama Dokter]\n📅 Tanggal: [Tanggal]\n\nSilakan datang 15 menit lebih awal. Tunjukkan pesan ini ke resepsionis.\n\nTerima kasih 🙏`,
  },
  {
    key: "queueCalled",
    title: "Antrian Dipanggil",
    trigger: "Dikirim otomatis saat nomor antrian pasien dipanggil",
    preview: `Halo [Nama Pasien] 👋\n\nNomor antrian Anda *[No Antrian]* sudah *dipanggil*.\n🏥 [Nama Poli]\n\nSilakan segera menuju ruangan. Terima kasih 🙏`,
  },
  {
    key: "labReady",
    title: "Hasil Lab Siap",
    trigger: "Dikirim otomatis saat status permintaan lab diubah ke 'selesai'",
    preview: `Halo [Nama Pasien] 👋\n\nHasil pemeriksaan laboratorium Anda sudah *siap*:\n🔬 [Jenis Pemeriksaan]\n\nSilakan hubungi klinik untuk pengambilan hasil. Terima kasih 🙏`,
  },
  {
    key: "reminderH1",
    title: "Reminder H-1",
    trigger: "Dikirim manual atau terjadwal H-1 sebelum kunjungan pasien",
    preview: `Halo [Nama Pasien] 👋\n\n*Reminder Kunjungan Besok*\n👨‍⚕️ Dokter: [Nama Dokter]\n📅 Tanggal: [Tanggal]\n\nMohon datang 15 menit lebih awal 🙏`,
  },
]

const STORAGE_KEY = "wa_notification_active"

function getInitialActive(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as Record<string, boolean>
  } catch {}
  return { bookingConfirm: true, queueCalled: true, labReady: true, reminderH1: true }
}

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ""
}

export default function NotifikasiWaPage() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [active, setActive] = useState<Record<string, boolean>>({})

  const [fonnteToken, setFonnteToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [savingToken, setSavingToken] = useState(false)
  const [tokenMsg, setTokenMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [showTestModal, setShowTestModal] = useState(false)
  const [testPhone, setTestPhone] = useState("")
  const [testTemplate, setTestTemplate] = useState(TEMPLATES[0].key)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  async function checkStatus() {
    try {
      const token = await getToken()
      const r = await fetch("/api/wa/status", { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json() as { connected?: boolean }
      setConnected(d.connected ?? false)
    } catch {
      setConnected(false)
    }
  }

  async function loadFonnteToken() {
    try {
      const token = await getToken()
      const r = await fetch("/api/pengaturan", { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json() as { success?: boolean; clinic?: { fonnte_token?: string | null } }
      if (d.success && d.clinic?.fonnte_token) {
        setFonnteToken(d.clinic.fonnte_token)
      }
    } catch {}
  }

  useEffect(() => {
    setActive(getInitialActive())
    void checkStatus()
    void loadFonnteToken()
  }, [])

  async function handleSaveToken() {
    setSavingToken(true)
    setTokenMsg(null)
    try {
      const token = await getToken()
      const res = await fetch("/api/pengaturan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fonnte_token: fonnteToken }),
      })
      const d = await res.json() as { success: boolean; error?: string }
      if (d.success) {
        setTokenMsg({ ok: true, text: "Token berhasil disimpan." })
        void checkStatus()
      } else {
        setTokenMsg({ ok: false, text: d.error ?? "Gagal menyimpan token" })
      }
    } catch {
      setTokenMsg({ ok: false, text: "Terjadi kesalahan jaringan" })
    } finally {
      setSavingToken(false)
    }
  }

  function toggleActive(key: string) {
    setActive((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  async function handleTestSend() {
    if (!testPhone) return
    setTestLoading(true)
    setTestResult(null)
    try {
      const token = await getToken()
      const res = await fetch("/api/wa/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: testPhone, template: testTemplate }),
      })
      const d = await res.json() as { success: boolean; error?: string }
      setTestResult({ success: d.success, message: d.success ? "Pesan berhasil dikirim!" : (d.error ?? "Gagal mengirim pesan") })
    } catch {
      setTestResult({ success: false, message: "Terjadi kesalahan jaringan" })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifikasi WhatsApp</h1>
        <p className="mt-1 text-sm text-gray-500">
          Konfigurasi pesan otomatis yang dikirim ke pasien melalui WhatsApp via Fonnte.
        </p>
      </div>

      {/* Status koneksi */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-white">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Status Koneksi Fonnte</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Token tersimpan per-klinik di database.
          </p>
        </div>
        {connected === null ? (
          <span className="text-xs text-gray-400">Mengecek...</span>
        ) : connected ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            Disconnected
          </span>
        )}
      </div>

      {/* Konfigurasi Token */}
      <div className="rounded-lg border bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Token Fonnte</h2>
        <p className="text-xs text-gray-500">
          Dapatkan token dari <strong>fonnte.com</strong> → menu Device → klik nama device → salin Token.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showToken ? "text" : "password"}
              value={fonnteToken}
              onChange={(e) => setFonnteToken(e.target.value)}
              placeholder="Masukkan token Fonnte..."
              className="w-full border rounded-lg px-3 py-2 text-sm pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700"
            >
              {showToken ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
          <button
            type="button"
            onClick={handleSaveToken}
            disabled={savingToken}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {savingToken ? "Menyimpan..." : "Simpan Token"}
          </button>
        </div>
        {tokenMsg && (
          <p className={`text-xs ${tokenMsg.ok ? "text-green-600" : "text-red-600"}`}>
            {tokenMsg.text}
          </p>
        )}
      </div>

      {/* Template cards */}
      <div className="space-y-4">
        {TEMPLATES.map((tpl) => (
          <div key={tpl.key} className="rounded-lg border bg-white p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-gray-900">{tpl.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{tpl.trigger}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!active[tpl.key]}
                onClick={() => toggleActive(tpl.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                  active[tpl.key] ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    active[tpl.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <pre className="text-xs text-gray-700 bg-gray-50 rounded p-3 whitespace-pre-wrap font-sans border">
              {tpl.preview}
            </pre>
          </div>
        ))}
      </div>

      {/* Tombol Test Kirim */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setShowTestModal(true); setTestResult(null) }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          📱 Test Kirim
        </button>
      </div>

      {/* Modal Test */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Test Kirim WA</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <select
                  value={testTemplate}
                  onChange={(e) => setTestTemplate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.key} value={t.key}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {testResult && (
              <div className={`text-sm px-3 py-2 rounded-lg ${testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {testResult.message}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleTestSend}
                disabled={testLoading || !testPhone}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {testLoading ? "Mengirim..." : "Kirim"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
