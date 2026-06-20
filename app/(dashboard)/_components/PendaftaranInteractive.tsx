"use client"

import { useState } from "react"

export function LabRadiologyRegistrationClient() {
  const [message, setMessage] = useState<string | null>(null)

  const onAdd = () => {
    setMessage("Fitur tambah pendaftaran segera tersedia. Silakan hubungi admin untuk aktivasi cepat.")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pendaftaran</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Pendaftaran Lab & Radiologi</h1>
          <p className="mt-2 max-w-2xl text-slate-400">Kelola registrasi pemeriksaan penunjang secara digital, langsung dari dashboard.</p>
        </div>
        <button className="btn-secondary" onClick={onAdd} type="button">
          Tambah Pendaftaran
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/30 p-6 shadow-md">
          <p className="text-sm text-slate-400">Pasien Lab Hari Ini</p>
          <h2 className="mt-3 text-3xl font-bold text-white">42</h2>
          <p className="mt-2 text-xs text-slate-500">Proyeksi naik 18% dari kemarin.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/30 p-6 shadow-md">
          <p className="text-sm text-slate-400">Pengambilan Radiologi</p>
          <h2 className="mt-3 text-3xl font-bold text-white">15</h2>
          <p className="mt-2 text-xs text-slate-500">70% jadwal sudah dikonfirmasi.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/30 p-6 shadow-md">
          <p className="text-sm text-slate-400">Hasil Siap</p>
          <h2 className="mt-3 text-3xl font-bold text-white">9</h2>
          <p className="mt-2 text-xs text-slate-500">Hasil laboratorium dalam proses review dokter.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 shadow-md">
        <h2 className="text-lg font-bold text-white mb-4">Daftar Pendaftaran Lab & Radiologi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-700/20">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pasien</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dokter Pengirim</th>
              </tr>
            </thead>
            <tbody>
              {[
                { time: "08:30", patient: "Ahmad Rahman", service: "Lab Darah", status: "Menunggu", doctor: "Dr. Sarah" },
                { time: "09:00", patient: "Siti Aminah", service: "USG", status: "Diproses", doctor: "Dr. Budi" },
                { time: "09:45", patient: "Budi Santoso", service: "X-Ray", status: "Selesai", doctor: "Dr. Maya" },
                { time: "10:15", patient: "Rina Wijaya", service: "CT Scan", status: "Konfirmasi", doctor: "Dr. Ahmad" },
              ].map((row) => (
                <tr key={`${row.patient}-${row.time}`} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                  <td className="py-3 px-4 text-slate-300">{row.time}</td>
                  <td className="py-3 px-4 text-white font-medium">{row.patient}</td>
                  <td className="py-3 px-4">{row.service}</td>
                  <td className="py-3 px-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      row.status === "Selesai"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : row.status === "Diproses"
                        ? "bg-blue-500/10 text-blue-300"
                        : row.status === "Konfirmasi"
                        ? "bg-amber-500/10 text-amber-300"
                        : "bg-slate-700/20 text-slate-200"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{row.doctor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function PrivateBookingOnlineClient() {
  const [message, setMessage] = useState<string | null>(null)

  const onAdd = () => {
    setMessage("Fitur tambah booking berhasil dijalankan. Silakan lengkapi data booking di modul selanjutnya.")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pendaftaran</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Private Booking Online</h1>
          <p className="mt-2 max-w-2xl text-slate-400">Kelola booking khusus untuk pasien privat melalui sistem online.</p>
        </div>
        <button className="btn-secondary" onClick={onAdd} type="button">
          Tambah Booking Baru
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Booking Aktif</p>
          <h2 className="mt-3 text-4xl font-bold text-white">24</h2>
          <p className="mt-2 text-xs text-slate-500">Bulan ini</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Konfirmasi Pending</p>
          <h2 className="mt-3 text-4xl font-bold text-white">8</h2>
          <p className="mt-2 text-xs text-slate-500">Menunggu approval</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Revenue Potensial</p>
          <h2 className="mt-3 text-4xl font-bold text-white">Rp 4.8M</h2>
          <p className="mt-2 text-xs text-slate-500">Dari booking aktif</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-4 shadow-md">
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-700/20">
              <th className="py-3 px-4">Pasien</th>
              <th className="py-3 px-4">Dokter</th>
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Waktu</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { patient: "Ahmad Rahman", doctor: "Dr. Sarah Johnson", date: "2026-05-15", time: "14:00", status: "Confirmed" },
              { patient: "Siti Aminah", doctor: "Dr. Budi Santoso", date: "2026-05-16", time: "10:30", status: "Pending" },
              { patient: "Rina Wijaya", doctor: "Dr. Maya Putri", date: "2026-05-17", time: "16:00", status: "Confirmed" },
            ].map((booking) => (
              <tr key={`${booking.patient}-${booking.date}`} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                <td className="py-3 px-4 text-white font-medium">{booking.patient}</td>
                <td className="py-3 px-4">{booking.doctor}</td>
                <td className="py-3 px-4">{booking.date}</td>
                <td className="py-3 px-4">{booking.time}</td>
                <td className="py-3 px-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    booking.status === "Confirmed"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-amber-500/10 text-amber-300"
                  }`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function MandiriEKiosWrapperClient() {
  const [message, setMessage] = useState<string | null>(null)

  const onRegister = () => {
    setMessage("Pendaftaran mandiri berhasil dipicu. Silakan lanjutkan data pasien di sistem pendaftaran.")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pendaftaran</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Pendaftaran Mandiri (E-Kios)</h1>
          <p className="mt-2 max-w-2xl text-slate-400">Alur registrasi pasien mandiri yang terintegrasi dengan kiosk atau aplikasi pasien.</p>
        </div>
        <button className="btn-secondary" onClick={onRegister} type="button">
          Tambah Registrasi Mandiri
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Total Registrasi</p>
          <h2 className="mt-3 text-4xl font-bold text-white">18</h2>
          <p className="mt-2 text-xs text-slate-500">Jumlah pasien mandiri saat ini.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Selesai Verifikasi</p>
          <h2 className="mt-3 text-4xl font-bold text-white">12</h2>
          <p className="mt-2 text-xs text-slate-500">Sudah siap dilayani.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Dalam Antrian</p>
          <h2 className="mt-3 text-4xl font-bold text-white">6</h2>
          <p className="mt-2 text-xs text-slate-500">Menunggu konfirmasi pendaftaran.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-4 shadow-md">
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-700/20">
              <th className="py-3 px-4">Pasien</th>
              <th className="py-3 px-4">Tipe</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {[
              { patient: "Andi Setiawan", type: "Mandiri", status: "Selesai", time: "08:20" },
              { patient: "Wulan Sari", type: "Mandiri", status: "Menunggu", time: "08:45" },
              { patient: "Tono Pratama", type: "Mandiri", status: "Dalam Antrian", time: "09:10" },
            ].map((item) => (
              <tr key={`${item.patient}-${item.time}`} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                <td className="py-3 px-4 text-white font-medium">{item.patient}</td>
                <td className="py-3 px-4">{item.type}</td>
                <td className="py-3 px-4">{item.status}</td>
                <td className="py-3 px-4">{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
