/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"

type InvoiceData = {
  id: string
  visit_date: string
  price?: number
  patients?: {
    name?: string
    phone?: string
  }
  doctors?: {
    name?: string
  }
}

type InvoiceApiResponse = {
  success?: boolean
  error?: string
  invoice?: InvoiceData
}

export default function InvoicePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [data, setData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError("")

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      if (!token) {
        setError("Sesi login tidak ditemukan. Silakan login ulang.")
        return
      }

      const res = await fetch(`/api/invoices/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = (await res.json()) as InvoiceApiResponse

      if (!res.ok || !result.success || !result.invoice) {
        setError(result.error || "Invoice tidak ditemukan")
        return
      }

      setData(result.invoice)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengambil invoice"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    fetchData()
  }, [id, fetchData])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-slate-400">Loading invoice...</div>
    </div>
  )

  if (error || !data) return (
    <div className="flex items-center justify-center py-20">
      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-8 text-center">
        <p className="text-lg font-semibold text-white mb-2">Invoice tidak bisa ditampilkan</p>
        <p className="text-slate-400">{error || "Data invoice tidak ditemukan"}</p>
      </div>
    </div>
  )

  const formatDate = (d: string) => new Date(d).toLocaleDateString("id-ID")
  const price = data.price ?? 0
  const invoiceNumber = `INV-${data.id?.slice(0, 8).toUpperCase()}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-10 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 shadow-2xl print:shadow-none print:rounded-none print:border-none print:bg-white print:text-gray-800">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700/20 pb-6 gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <span className="text-2xl font-bold text-white">X</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent print:text-gray-800">XaviKlinika</h1>
              <p className="text-slate-500 text-sm print:text-gray-600">Klinik Digital Modern & Premium</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-500 print:text-gray-600">INVOICE</p>
            <p className="text-2xl font-bold text-white print:text-gray-800">{invoiceNumber}</p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:text-gray-700">
          <div>
            <p className="text-slate-500 text-sm font-semibold mb-2 print:text-gray-600 uppercase tracking-wider">Ditagihkan Kepada</p>
            <div className="bg-gradient-to-br from-indigo-950/30 to-slate-900/20 rounded-2xl p-4 border border-slate-700/20 print:bg-gray-50 print:border print:border-gray-200">
              <p className="text-lg font-bold text-white print:text-gray-800">{data.patients?.name || "-"}</p>
              <p className="text-slate-400 text-sm print:text-gray-600 mt-2">📞 {data.patients?.phone || "-"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-sm font-semibold mb-2 print:text-gray-600 uppercase tracking-wider">Rincian Layanan</p>
            <div className="bg-gradient-to-br from-indigo-950/30 to-slate-900/20 rounded-2xl p-4 border border-slate-700/20 print:bg-gray-50 print:border print:border-gray-200 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">📅 Tanggal:</span>
                  <span className="font-semibold text-white print:text-gray-800">{formatDate(data.visit_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">👨‍⚕️ Dokter:</span>
                  <span className="font-semibold text-white print:text-gray-800">{data.doctors?.name || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 rounded-2xl overflow-hidden border border-slate-700/20 print:border print:border-gray-300">
          <div className="grid grid-cols-3 bg-gradient-to-r from-indigo-950/40 to-slate-900/30 p-4 text-sm font-bold border-b border-slate-700/20 print:bg-gray-100 print:border-gray-300">
            <div className="text-slate-200 print:text-gray-700">Layanan</div>
            <div className="text-center text-slate-200 print:text-gray-700">Tanggal</div>
            <div className="text-right text-slate-200 print:text-gray-700">Harga</div>
          </div>

          <div className="grid grid-cols-3 p-4 text-sm bg-slate-900/30 border-t border-slate-700/20 hover:bg-slate-900/50 transition print:bg-white print:border-gray-300 print:text-gray-700">
            <div className="text-slate-300 font-medium print:text-gray-800">Konsultasi Dokter</div>
            <div className="text-center text-slate-300 print:text-gray-800">{formatDate(data.visit_date)}</div>
            <div className="text-right text-slate-300 print:text-gray-800">Rp {price.toLocaleString("id-ID")}</div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-full md:w-72">
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-slate-400 print:text-gray-700">
                <span>Subtotal</span>
                <span className="text-slate-200 print:text-gray-800 font-medium">Rp {price.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400 print:text-gray-700">
                <span>Pajak (0%)</span>
                <span className="text-slate-200 print:text-gray-800 font-medium">Rp 0</span>
              </div>
              <div className="border-t border-slate-700/20 print:border-gray-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-white print:text-gray-800">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent print:text-gray-800">Rp {price.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="rounded-2xl border border-slate-700/20 bg-slate-900/30 p-6 mb-8 print:bg-gray-50 print:border-gray-300">
          <p className="font-bold text-white mb-4 text-sm uppercase tracking-wider print:text-gray-800">📋 Metode Pembayaran</p>
          <div className="space-y-2 text-sm text-slate-300 print:text-gray-700">
            <p className="font-semibold text-white print:text-gray-800">💳 Bank Transfer BCA</p>
            <p>Nomor Rekening: <span className="font-mono font-bold">123456789</span></p>
            <p>Atas Nama: <span className="font-bold">Xavindo Clinic</span></p>
          </div>
          {/* QRIS would go here if image exists */}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 print:text-gray-600 mb-6">
          <p>Terima kasih telah mempercayakan layanan kesehatan Anda kepada kami! 🏥✨</p>
          <p className="mt-2">Invoice ini berlaku sebagai bukti pembayaran yang sah</p>
        </div>

        {/* Print Button */}
        <div className="flex justify-end gap-3 print:hidden">
          <button 
            onClick={() => window.print()} 
            className="btn-primary text-sm px-6"
          >
            📥 Download / Print PDF
          </button>
        </div>
      </div>
    </div>
  )
}
