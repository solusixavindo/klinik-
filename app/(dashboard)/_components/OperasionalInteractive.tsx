"use client"

import { useState } from "react"

export function BpjsBridgingClient() {
  const [message, setMessage] = useState<string | null>(null)

  const services = [
    { name: "VClaim SEP", status: "Aktif", total: 48 },
    { name: "Rujukan Online", status: "Sinkron", total: 32 },
    { name: "Antrean BPJS", status: "Aktif", total: 71 },
    { name: "Klaim INA-CBG", status: "Review", total: 12 },
  ]

  const handleSync = () => {
    setMessage("Sinkronisasi manual berhasil dijalankan. Data BPJS akan diperbarui dalam beberapa detik.")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Operasional</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Bridging BPJS</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Simulasi fitur Profesional dan Premium untuk SEP, rujukan, antrean BPJS, klaim, dan integrasi bridging.
          </p>
        </div>
        <button className="btn-secondary" onClick={handleSync} type="button">
          Sinkronisasi Manual
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        {services.map((item) => (
          <div key={item.name} className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
            <p className="text-sm text-slate-400">{item.name}</p>
            <h2 className="mt-3 text-3xl font-bold text-white">{item.total}</h2>
            <p className="mt-2 text-emerald-300 text-xs">{item.status}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 shadow-md">
        <h2 className="text-lg font-bold text-white">Alur Bridging</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            "Cek peserta",
            "Buat SEP",
            "Kirim antrean",
            "Rekap klaim",
          ].map((step, index) => (
            <div key={step} className="rounded-2xl border border-slate-700/20 bg-slate-950/40 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Langkah {index + 1}</p>
              <p className="mt-2 font-semibold text-white">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
