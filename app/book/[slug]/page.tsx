"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

// ── Types ──────────────────────────────────────────────────────
type Doctor = {
  id: string
  name: string
  specialization: string | null
  is_active: boolean
}

type Schedule = {
  id: string
  doctor_id: string
  day: string
  start_time: string
  end_time: string
}

type ClinicData = {
  id: string
  name: string
  address: string | null
  phone: string | null
  slug: string
}

type BookingResult = {
  booking_id: string
  queue_number: number
  doctor_name: string
  visit_date: string
  patient_name: string
}

// ── Day helpers ───────────────────────────────────────────────
const DAY_NAMES: Record<string, string> = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu",
}

const JS_DAY_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
}

function todayISOString(): string {
  const now = new Date()
  return now.toISOString().split("T")[0]
}

// ── Initial avatar ────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1, #818cf8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: 20,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  const steps = ["Pilih Dokter", "Pilih Jadwal", "Data Pasien", "Konfirmasi"]
  return (
    <div style={{ padding: "16px 0 8px" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 9999,
              background: i < step ? "#6366f1" : "#e0e7ff",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "#6366f1", fontWeight: 600, textAlign: "center" }}>
        Langkah {step} dari {total} — {steps[step - 1]}
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function PublicBookingPage() {
  const params = useParams()
  const slug = typeof params.slug === "string" ? params.slug : Array.isArray(params.slug) ? params.slug[0] : ""

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [clinic, setClinic] = useState<ClinicData | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])

  const [step, setStep] = useState(1)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [dateError, setDateError] = useState("")

  const [patientName, setPatientName] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [patientNotes, setPatientNotes] = useState("")
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/public/clinic/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setNotFound(true)
        } else {
          setClinic(data.clinic)
          setDoctors(data.doctors ?? [])
          setSchedules(data.schedules ?? [])
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  // Schedules for selected doctor
  const doctorSchedules = selectedDoctor
    ? schedules.filter((s) => s.doctor_id === selectedDoctor.id)
    : []

  const allowedDays = doctorSchedules.map((s) => s.day.toLowerCase())

  function handleDateChange(val: string) {
    setSelectedDate(val)
    setDateError("")
    if (val) {
      const dayIndex = new Date(val + "T00:00:00").getDay()
      const dayName = JS_DAY_MAP[dayIndex]
      if (!allowedDays.includes(dayName)) {
        const allowed = allowedDays.map((d) => DAY_NAMES[d] ?? d).join(", ")
        setDateError(`Dokter ini hanya praktik pada: ${allowed}`)
      }
    }
  }

  async function handleSubmit() {
    setFormError("")
    if (!patientName.trim()) { setFormError("Nama lengkap wajib diisi"); return }
    if (!patientPhone.trim()) { setFormError("Nomor HP wajib diisi"); return }
    if (!patientPhone.trim().match(/^0[0-9]{8,13}$/)) {
      setFormError("Nomor HP tidak valid (contoh: 08123456789)")
      return
    }
    if (!clinic || !selectedDoctor || !selectedDate) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/public/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinic.id,
          doctor_id: selectedDoctor.id,
          visit_date: selectedDate,
          patient_name: patientName.trim(),
          patient_phone: patientPhone.trim(),
          patient_email: patientEmail.trim() || undefined,
          notes: patientNotes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setFormError(data.error ?? "Gagal membuat booking")
      } else {
        setBookingResult(data)
        setStep(4)
      }
    } catch {
      setFormError("Terjadi kesalahan jaringan. Coba lagi.")
    } finally {
      setSubmitting(false)
    }
  }

  function resetBooking() {
    setStep(1)
    setSelectedDoctor(null)
    setSelectedDate("")
    setDateError("")
    setPatientName("")
    setPatientPhone("")
    setPatientEmail("")
    setPatientNotes("")
    setFormError("")
    setBookingResult(null)
  }

  // ── UI ──────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 0 40px",
  }

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 2px 16px rgba(99,102,241,0.08)",
    padding: "24px 20px",
    margin: "0 auto",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #e0e7ff",
    borderRadius: 8,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    color: "#1e293b",
  }

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    padding: "12px 0",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  }

  const btnSecondary: React.CSSProperties = {
    ...btnPrimary,
    background: "#e0e7ff",
    color: "#6366f1",
    marginTop: 0,
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 4,
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ marginTop: 80, textAlign: "center", color: "#6366f1" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>Memuat data klinik...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={containerStyle}>
        <div style={{ marginTop: 60, ...cardStyle, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏥</div>
          <h2 style={{ color: "#1e293b", marginTop: 0 }}>Klinik tidak ditemukan</h2>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            Hubungi klinik Anda untuk mendapatkan link booking yang benar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
          padding: "20px 20px 28px",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            marginBottom: 10,
          }}
        >
          🏥
        </div>
        <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{clinic?.name}</h1>
        {clinic?.address && (
          <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>{clinic.address}</p>
        )}
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 480, padding: "0 12px", marginTop: -16, boxSizing: "border-box" }}>
        <div style={cardStyle}>
          {/* Step 4: Success */}
          {step === 4 && bookingResult && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h2 style={{ color: "#1e293b", marginTop: 0, marginBottom: 4 }}>Booking Berhasil!</h2>
              <p style={{ color: "#64748b", marginBottom: 20, lineHeight: 1.5 }}>
                Silakan datang 15 menit lebih awal.<br />
                Tunjukkan nomor booking ini ke resepsionis.
              </p>
              <div
                style={{
                  background: "#f1f5f9",
                  borderRadius: 12,
                  padding: "16px",
                  marginBottom: 20,
                  textAlign: "left",
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>NOMOR BOOKING</span>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: "#6366f1",
                      lineHeight: 1.2,
                    }}
                  >
                    #{String(bookingResult.queue_number).padStart(3, "0")}
                  </div>
                </div>
                <div style={{ display: "grid", gap: 6, fontSize: 14 }}>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Pasien: </span>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{bookingResult.patient_name}</span>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Dokter: </span>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{bookingResult.doctor_name}</span>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Tanggal: </span>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{formatDate(bookingResult.visit_date)}</span>
                  </div>
                </div>
              </div>
              <button onClick={resetBooking} style={btnPrimary}>
                Booking Lagi
              </button>
            </div>
          )}

          {step !== 4 && (
            <>
              <ProgressBar step={step} total={3} />

              {/* Step 1: Pilih Dokter */}
              {step === 1 && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: 17 }}>Pilih Dokter</h3>
                  {doctors.length === 0 ? (
                    <p style={{ color: "#94a3b8", textAlign: "center" }}>Tidak ada dokter tersedia.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {doctors.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setSelectedDoctor(doc)
                            setSelectedDate("")
                            setDateError("")
                            setStep(2)
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "14px 16px",
                            border: "1.5px solid #e0e7ff",
                            borderRadius: 12,
                            background: "#fff",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#6366f1"
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.15)"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e0e7ff"
                            e.currentTarget.style.boxShadow = "none"
                          }}
                        >
                          <Avatar name={doc.name} />
                          <div>
                            <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>{doc.name}</div>
                            {doc.specialization && (
                              <div style={{ fontSize: 13, color: "#6366f1", marginTop: 2 }}>{doc.specialization}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Pilih Jadwal */}
              {step === 2 && selectedDoctor && (
                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 14, marginBottom: 12, padding: 0 }}
                  >
                    ← Ganti dokter
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 14px", background: "#f1f5f9", borderRadius: 10 }}>
                    <Avatar name={selectedDoctor.name} />
                    <div>
                      <div style={{ fontWeight: 700, color: "#1e293b" }}>{selectedDoctor.name}</div>
                      {selectedDoctor.specialization && (
                        <div style={{ fontSize: 13, color: "#6366f1" }}>{selectedDoctor.specialization}</div>
                      )}
                    </div>
                  </div>

                  <h3 style={{ margin: "0 0 12px", color: "#1e293b", fontSize: 17 }}>Pilih Tanggal Kunjungan</h3>

                  {doctorSchedules.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ margin: "0 0 8px", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                        Jadwal praktik:
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {doctorSchedules.map((s) => (
                          <span
                            key={s.id}
                            style={{
                              padding: "4px 10px",
                              background: "#e0e7ff",
                              color: "#6366f1",
                              borderRadius: 99,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {DAY_NAMES[s.day.toLowerCase()] ?? s.day} {s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <label style={labelStyle} htmlFor="visit-date">Tanggal</label>
                  <input
                    id="visit-date"
                    type="date"
                    value={selectedDate}
                    min={todayISOString()}
                    onChange={(e) => handleDateChange(e.target.value)}
                    style={{ ...inputStyle, marginBottom: 6 }}
                  />
                  {dateError && (
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "#ef4444" }}>{dateError}</p>
                  )}

                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !!dateError}
                    style={{
                      ...btnPrimary,
                      opacity: !selectedDate || !!dateError ? 0.5 : 1,
                      cursor: !selectedDate || !!dateError ? "not-allowed" : "pointer",
                    }}
                  >
                    Lanjut →
                  </button>
                </div>
              )}

              {/* Step 3: Data Pasien */}
              {step === 3 && (
                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={() => setStep(2)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 14, marginBottom: 12, padding: 0 }}
                  >
                    ← Ubah tanggal
                  </button>
                  <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: 17 }}>Isi Data Pasien</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={labelStyle} htmlFor="p-name">Nama Lengkap *</label>
                      <input
                        id="p-name"
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Nama sesuai KTP"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle} htmlFor="p-phone">No. HP *</label>
                      <input
                        id="p-phone"
                        type="tel"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle} htmlFor="p-email">Email (opsional)</label>
                      <input
                        id="p-email"
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="contoh@email.com"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle} htmlFor="p-notes">Catatan / Keluhan</label>
                      <textarea
                        id="p-notes"
                        value={patientNotes}
                        onChange={(e) => setPatientNotes(e.target.value)}
                        placeholder="Ceritakan keluhan Anda (opsional)"
                        rows={3}
                        style={{ ...inputStyle, resize: "vertical" }}
                      />
                    </div>
                  </div>

                  {formError && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        background: "#fee2e2",
                        color: "#dc2626",
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      {formError}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      ...btnPrimary,
                      marginTop: 16,
                      opacity: submitting ? 0.7 : 1,
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "Memproses..." : "Kirim Booking"}
                  </button>
                  <button onClick={resetBooking} style={{ ...btnSecondary, marginTop: 8 }}>
                    Batal
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
