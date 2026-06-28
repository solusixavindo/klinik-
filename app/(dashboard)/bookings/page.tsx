/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useProfile } from "@/hooks/useProfile"
import { getDemoSession } from "@/lib/demoSession"
import { toast } from "sonner"
import { demoDoctors, demoPatients, getDemoBookings } from "@/lib/demoData"

type Patient = {
  id: string
  name: string
  phone: string
  clinic_id?: string
}

type Doctor = {
  id: string
  name: string
  clinic_id?: string
}

type Booking = {
  id: string
  patient_id?: string
  doctor_id?: string
  clinic_id?: string
  visit_date: string
  price: number
  payment_status?: string
  patients?: Patient
  doctors?: Doctor
}

export default function BookingPage() {
  const { profile, loading } = useProfile()
  const clinicId = profile?.clinic_id
  const [data, setData] = useState<Booking[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [form, setForm] = useState({ patient_id: "", doctor_id: "", visit_date: "", price: "" })
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!clinicId) return

    if (getDemoSession()) {
      setPatients(demoPatients)
      setDoctors(demoDoctors)
      setData(getDemoBookings())
      return
    }

    setLoadingData(true)

    const [patientsRes, doctorsRes, bookingsRes] = await Promise.all([
      supabase
        .from("patients")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("name", { ascending: true }),
      supabase
        .from("doctors")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("name", { ascending: true }),
      supabase
        .from("bookings")
        .select("*, patients(*), doctors(*)")
        .eq("clinic_id", clinicId)
        .order("visit_date", { ascending: false }),
    ])

    if (patientsRes.error || doctorsRes.error || bookingsRes.error) {
      console.error("Fetch bookings data failed", patientsRes.error || doctorsRes.error || bookingsRes.error)
      toast.error((patientsRes.error || doctorsRes.error || bookingsRes.error)?.message || "Gagal mengambil data booking")
      setLoadingData(false)
      return
    }

    setPatients(patientsRes.data || [])
    setDoctors(doctorsRes.data || [])
    setData(bookingsRes.data || [])
    setLoadingData(false)
  }, [clinicId])

  useEffect(() => {
    if (!profile) return
    fetchAll()
  }, [profile, fetchAll])

  const submit = async () => {
    if (!form.patient_id || !form.doctor_id || !form.visit_date || !form.price) {
      toast.error("Semua field booking wajib diisi")
      return
    }

    if (!clinicId) {
      toast.error("Data klinik belum tersedia. Silakan login ulang.")
      return
    }

    const price = Number(form.price)
    if (!price || price <= 0) {
      toast.error("Harga harus angka positif")
      return
    }

    setSaving(true)

    try {
      if (getDemoSession()) {
        const patient = patients.find((item) => item.id === form.patient_id)
        const doctor = doctors.find((item) => item.id === form.doctor_id)
        const booking: Booking = {
          id: `demo-booking-${Date.now()}`,
          patient_id: form.patient_id,
          doctor_id: form.doctor_id,
          clinic_id: clinicId,
          visit_date: form.visit_date,
          price,
          payment_status: "pending",
          patients: patient,
          doctors: doctor,
        }
        setForm({ patient_id: "", doctor_id: "", visit_date: "", price: "" })
        setData((current) => [booking, ...current])
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error("Sesi login tidak valid. Silakan login ulang.")
        return
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          patient_id: form.patient_id,
          doctor_id: form.doctor_id,
          visit_date: form.visit_date,
          price,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        toast.error(result.error || "Gagal membuat booking")
        return
      }

      setForm({ patient_id: "", doctor_id: "", visit_date: "", price: "" })
      setData((current) => [result.booking, ...current])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat booking"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const sendWA = (booking: Booking) => {
    const phone = booking.patients?.phone
    if (!phone) {
      toast.error("Nomor HP pasien tidak tersedia")
      return
    }

    const phone62 = phone.replace(/^0/, "62")
    const msg = `Halo ${booking.patients?.name}
Dokter: ${booking.doctors?.name}
Tanggal: ${booking.visit_date}
Total: Rp ${booking.price}`
    window.open(`https://wa.me/${phone62}?text=${encodeURIComponent(msg)}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading data booking...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Manajemen Booking</h1>
          <p className="text-slate-400">
            Total booking:{" "}
            <span className="font-semibold text-indigo-400">{data.length}</span>
            {loadingData ? (
              <span className="ml-2 text-xs text-slate-500">(memuat ulang)</span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 backdrop-blur-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-6">Buat Booking Baru</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Pilih Pasien *</label>
            <select
              value={form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
              className="input"
            >
              <option value="">-- Pilih Pasien --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Pilih Dokter *</label>
            <select
              value={form.doctor_id}
              onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
              className="input"
            >
              <option value="">-- Pilih Dokter --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Tanggal Kunjungan *</label>
            <input
              type="date"
              value={form.visit_date}
              onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Harga / Tarif *</label>
            <input
              type="number"
              placeholder="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "Menyimpan..." : "+ Tambah Booking"}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 backdrop-blur-xl p-12 text-center">
            <p className="text-slate-400 text-lg">Belum ada data booking</p>
            <p className="text-slate-500 text-sm mt-2">Mulai buat booking baru untuk pasien Anda</p>
          </div>
        ) : (
          data.map((booking) => (
            <div key={booking.id} className="group rounded-2xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 backdrop-blur-xl p-4 shadow-md hover:shadow-lg hover:border-slate-600/30 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">👤 {booking.patients?.name || "-"}</h3>
                    <span className={`badge ${booking.payment_status === "paid" ? "badge-success" : booking.payment_status === "pending" ? "badge-warning" : "badge-danger"}`}>
                      {booking.payment_status === "paid" ? "✓ Dibayar" : booking.payment_status === "pending" ? "⏳ Pending" : "✗ Belum"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="text-slate-400">
                      <span className="text-slate-500">👨‍⚕️</span> Dokter: <span className="text-white font-medium">{booking.doctors?.name || "-"}</span>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500">📅</span> Tanggal: <span className="text-white font-medium">{booking.visit_date}</span>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500">💰</span> Tarif: <span className="text-white font-medium">Rp {Number(booking.price).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    href={`/invoice/${booking.id}`}
                    className="btn-primary text-sm px-4 py-2 whitespace-nowrap text-center"
                  >
                    💰 Invoice
                  </Link>
                  <button
                    onClick={() => sendWA(booking)}
                    className="btn-secondary text-sm px-4 py-2 whitespace-nowrap"
                  >
                    💬 Kirim WA
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
