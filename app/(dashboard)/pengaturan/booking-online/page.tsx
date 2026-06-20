"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type ProfileData = {
  clinic_id: string
  clinics?: {
    name?: string
    slug?: string
    online_booking_enabled?: boolean
  }
}

export default function BookingOnlinePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [clinicId, setClinicId] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [slug, setSlug] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [copied, setCopied] = useState(false)

  const publicUrl =
    typeof window !== "undefined" && slug
      ? `${window.location.origin}/book/${slug}`
      : ""

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError("Sesi tidak ditemukan. Silakan login ulang.")
        setLoading(false)
        return
      }

      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!data.success || !data.profile) {
        setError(data.error ?? "Gagal memuat profil")
        setLoading(false)
        return
      }

      const profile: ProfileData = data.profile
      setClinicId(profile.clinic_id)
      setClinicName(profile.clinics?.name ?? "")
      setSlug(profile.clinics?.slug ?? "")
      setEnabled(profile.clinics?.online_booking_enabled ?? true)
      setLoading(false)
    }
    load()
  }, [])

  async function handleToggle() {
    setSaving(true)
    setSaveMsg("")
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token || !clinicId) {
      setSaveMsg("Sesi tidak valid.")
      setSaving(false)
      return
    }

    // Update via supabase client (RLS allows own clinic update via profile)
    const { error: updateError } = await supabase
      .from("clinics")
      .update({ online_booking_enabled: !enabled })
      .eq("id", clinicId)

    if (updateError) {
      setSaveMsg(`Gagal menyimpan: ${updateError.message}`)
    } else {
      setEnabled(!enabled)
      setSaveMsg("Pengaturan berhasil disimpan.")
      setTimeout(() => setSaveMsg(""), 3000)
    }
    setSaving(false)
  }

  async function handleCopy() {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #e0e7ff",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 16,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "#64748b",
    marginBottom: 4,
    display: "block",
  }

  if (loading) {
    return (
      <div style={{ padding: 32, color: "#6366f1" }}>Memuat pengaturan...</div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 32, color: "#dc2626" }}>{error}</div>
    )
  }

  return (
    <div style={{ maxWidth: 560, padding: "24px 16px" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>
        Booking Online
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b" }}>
        Bagikan link ini ke pasien agar mereka bisa membuat janji tanpa perlu menghubungi klinik.
      </p>

      {/* Link section */}
      <div style={cardStyle}>
        <span style={labelStyle}>Link Booking Publik — {clinicName}</span>
        {slug ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                background: "#f1f5f9",
                borderRadius: 8,
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "#334155",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                }}
              >
                {publicUrl}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleCopy}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  background: copied ? "#10b981" : "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {copied ? "✓ Tersalin!" : "Salin Link"}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  padding: "9px 0",
                  background: "#e0e7ff",
                  color: "#6366f1",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                  textAlign: "center",
                  display: "inline-block",
                  boxSizing: "border-box",
                }}
              >
                Buka Preview
              </a>
            </div>
          </>
        ) : (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Slug klinik belum tersedia. Jalankan migrasi SQL di Supabase untuk mengatur slug otomatis.
          </p>
        )}
      </div>

      {/* QR Code section */}
      {slug && (
        <div style={cardStyle}>
          <span style={labelStyle}>QR Code Booking</span>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b" }}>
            Scan QR code ini untuk langsung membuka halaman booking:
          </p>
          {/* Menggunakan api.qrserver.com (gratis, tanpa API key) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}`}
            alt="QR Code Booking"
            width={180}
            height={180}
            style={{ borderRadius: 8, border: "1px solid #e0e7ff" }}
          />
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#94a3b8" }}>
            Tempel QR code ini di meja resepsionis atau brosur klinik.
          </p>
        </div>
      )}

      {/* Toggle section */}
      <div style={cardStyle}>
        <span style={labelStyle}>Status Booking Online</span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, color: "#1e293b", fontWeight: 500 }}>
              {enabled ? "Aktif" : "Nonaktif"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8" }}>
              {enabled
                ? "Pasien dapat membuat booking melalui link publik."
                : "Link publik menampilkan pesan booking tidak tersedia."}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            style={{
              width: 52,
              height: 28,
              borderRadius: 99,
              border: "none",
              background: enabled ? "#6366f1" : "#cbd5e1",
              cursor: saving ? "not-allowed" : "pointer",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
            aria-label={enabled ? "Nonaktifkan booking online" : "Aktifkan booking online"}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: enabled ? 26 : 3,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            />
          </button>
        </div>
        {saveMsg && (
          <p
            style={{
              marginTop: 10,
              fontSize: 13,
              color: saveMsg.startsWith("Gagal") ? "#dc2626" : "#10b981",
              fontWeight: 500,
            }}
          >
            {saveMsg}
          </p>
        )}
      </div>
    </div>
  )
}
