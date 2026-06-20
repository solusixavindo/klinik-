import Link from "next/link"
import { DashboardMenuItem } from "@/lib/dashboardMenu"

type ModulePlaceholderProps = {
  section: string
  item: DashboardMenuItem
}

const workflowSteps = [
  "Desain alur operasional",
  "Integrasi data klinik",
  "Aktivasi laporan dan kontrol akses",
]

export default function ModulePlaceholder({ section, item }: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">{section}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{item.label}</h1>
          <p className="mt-2 max-w-2xl text-slate-400">{item.description}</p>
        </div>
        <span className="badge badge-primary w-fit">Modul SaaS</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-6 shadow-md">
          <p className="text-sm text-slate-400">Status</p>
          <h3 className="mt-3 text-2xl font-bold text-white">Siap Dikembangkan</h3>
          <p className="mt-2 text-sm text-slate-500">Struktur halaman sudah tersedia untuk demo dan proposal.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-indigo-950/30 to-slate-900/30 p-6 shadow-md">
          <p className="text-sm text-slate-400">Prioritas</p>
          <h3 className="mt-3 text-2xl font-bold text-white">Paket Pro</h3>
          <p className="mt-2 text-sm text-slate-500">Cocok dijadikan pembeda paket harga premium.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-emerald-950/30 to-slate-900/30 p-6 shadow-md">
          <p className="text-sm text-slate-400">Akses</p>
          <h3 className="mt-3 text-2xl font-bold text-white">Role-Based</h3>
          <p className="mt-2 text-sm text-slate-500">Nanti bisa dibatasi untuk admin, staff, kasir, atau dokter.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Roadmap Modul</h2>
            <p className="mt-1 text-sm text-slate-400">Kerangka fitur sudah dibuat agar menu dapat ditawarkan sejak demo awal.</p>
          </div>
          <Link href="/" className="btn-secondary w-fit text-sm">
            Kembali ke Dashboard
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-slate-700/20 bg-slate-900/30 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Tahap {index + 1}</p>
              <p className="mt-2 font-semibold text-white">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
