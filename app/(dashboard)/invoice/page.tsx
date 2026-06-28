/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useProfile } from "@/hooks/useProfile"
import { toast } from "sonner"

type Patient = {
  name?: string
  phone?: string
}

type Doctor = {
  name?: string
}

type Booking = {
  id: string
  visit_date: string
  price?: number
  payment_status?: string
  patients?: Patient
  doctors?: Doctor
}

export default function InvoiceListPage() {
  const { profile, loading: profileLoading } = useProfile()
  const clinicId = profile?.clinic_id
  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!clinicId) return

    setLoading(true)

    const { data: bookingsData, error } = await supabase
      .from("bookings")
      .select("*, patients(*), doctors(*)")
      .eq("clinic_id", clinicId)
      .order("visit_date", { ascending: false })

    if (error) {
      console.error("Fetch invoice data failed", error)
      toast.error(error.message || "Gagal mengambil data invoice")
      setLoading(false)
      return
    }

    setData(bookingsData || [])
    setLoading(false)
  }, [clinicId])

  useEffect(() => {
    if (!clinicId) return
    fetchData()
  }, [clinicId, fetchData])

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading invoice...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Invoice & Pembayaran</h1>
        <p className="text-slate-400">
          Total invoice: <span className="font-semibold text-indigo-400">{data.length}</span>
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400">Loading data invoice...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 backdrop-blur-xl p-12 text-center">
            <p className="text-slate-400 text-lg">Belum ada invoice</p>
            <p className="text-slate-500 text-sm mt-2">Buat booking terlebih dahulu untuk menampilkan invoice</p>
          </div>
        ) : (
          data.map((booking) => (
            <div
              key={booking.id}
              className="group rounded-2xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 backdrop-blur-xl p-4 shadow-md hover:shadow-lg hover:border-slate-600/30 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">👤 {booking.patients?.name || "-"}</h3>
                    <span className={`badge ${booking.payment_status === "paid" ? "badge-success" : "badge-warning"}`}>
                      {booking.payment_status === "paid" ? "✓ Dibayar" : "⏳ Pending"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="text-slate-400">
                      <span className="text-slate-500">👨‍⚕️</span> Dokter: <span className="text-white font-medium">{booking.doctors?.name || "-"}</span>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500">📅</span> Tanggal: <span className="text-white font-medium">{booking.visit_date}</span>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500">💰</span> Total: <span className="text-white font-medium">Rp {Number(booking.price || 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>

                <Link href={`/invoice/${booking.id}`} className="btn-primary text-sm px-4 py-2 whitespace-nowrap text-center">
                  Lihat Invoice
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
