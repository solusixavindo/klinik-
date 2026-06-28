import Link from "next/link"
import { PLANS, type PlanCode } from "@/lib/billing"

const paidPlans: PlanCode[] = ["basic", "standard", "pro", "premium"]

const features = [
  { icon: "🏥", title: "Dashboard Operasional", desc: "Pantau pasien, antrian, dokter, dan pendapatan dalam satu layar." },
  { icon: "📋", title: "Rekam Medis Digital", desc: "Catatan medis terstruktur, riwayat kunjungan, dan diagnosis tersimpan aman." },
  { icon: "📦", title: "Manajemen Stok Obat", desc: "Monitor stok farmasi, alert menipis, dan laporan penjualan otomatis." },
  { icon: "💳", title: "Kasir & Invoice", desc: "Buat invoice, terima pembayaran, dan rekap keuangan klinik secara real-time." },
  { icon: "📅", title: "Booking & Antrian", desc: "Jadwal dokter, booking online, dan sistem antrian loket digital." },
  { icon: "🔬", title: "Laboratorium", desc: "Kelola permintaan lab, hasil pemeriksaan, dan validasi dokter." },
]

const planHighlights: Record<string, string[]> = {
  basic:    ["Data pasien & dokter", "Jadwal dokter", "Booking sederhana"],
  standard: ["Semua Basic +", "Antrian & Rekam Medis", "Operasional & BPJS"],
  pro:      ["Semua Standard +", "Kasir & Stok Obat", "Laboratorium & E-Resep"],
  premium:  ["Semua Pro +", "Multi-cabang", "Dashboard advanced"],
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-base font-bold shadow-lg shadow-indigo-600/20">
            X
          </div>
          <span className="text-lg font-bold">XaviKlinika</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">
            Masuk
          </Link>
          <Link href="/register" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20">
            Coba Gratis 14 Hari
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
          🎉 Gratis 14 hari untuk semua paket — tanpa kartu kredit
        </div>

        <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
          Sistem Manajemen Klinik
          <span className="block mt-2 bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
            Lengkap & Mudah Digunakan
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
          Kelola pasien, antrian, rekam medis, stok obat, dan keuangan klinik dalam satu platform. Aktif dalam 5 menit.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/register"
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/30 transition hover:shadow-indigo-600/50 hover:-translate-y-0.5">
            Mulai Trial Gratis 14 Hari →
          </Link>
          <Link href="/login"
            className="rounded-2xl border border-slate-700/60 px-8 py-4 text-base font-semibold text-slate-300 transition hover:bg-slate-800/50 hover:text-white">
            Sudah punya akun? Masuk
          </Link>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Tidak perlu kartu kredit · Batalkan kapan saja · Aktif dalam 5 menit
        </p>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Fitur Lengkap</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">Semua yang dibutuhkan klinik modern</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-3xl border border-slate-700/30 bg-slate-900/50 p-6 backdrop-blur-sm">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-3 font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Harga Transparan</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">Pilih paket sesuai ukuran klinik Anda</h2>
          <p className="mt-3 text-slate-400">Semua paket gratis 14 hari pertama. Tidak perlu kartu kredit.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paidPlans.map((code) => {
            const plan = PLANS[code]
            const isPopular = code === "pro"
            return (
              <div key={code}
                className={`relative rounded-3xl border p-6 ${isPopular ? "border-indigo-500/50 bg-gradient-to-br from-indigo-950/60 to-slate-900/40" : "border-slate-700/30 bg-slate-900/40"}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                    Paling Populer
                  </div>
                )}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-2xl font-bold text-white">{plan.priceLabel}</p>
                <p className="text-xs text-slate-500">setelah 14 hari gratis</p>
                <ul className="mt-4 space-y-2">
                  {planHighlights[code].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/register?plan=${code}`}
                  className={`mt-5 block rounded-2xl py-2.5 text-center text-sm font-semibold transition ${isPopular ? "bg-indigo-600 text-white hover:bg-indigo-500" : "border border-slate-600/60 text-slate-300 hover:bg-slate-800/60"}`}>
                  {code === "premium" ? "Hubungi Kami" : "Coba Gratis 14 Hari"}
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24 text-center">
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-slate-900/40 p-10 shadow-2xl">
          <h2 className="text-2xl font-bold md:text-3xl">Siap memulai digitalisasi klinik Anda?</h2>
          <p className="mt-3 text-slate-400">Daftar sekarang, gratis 14 hari. Tidak perlu kartu kredit.</p>
          <Link href="/register"
            className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-10 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/30 transition hover:-translate-y-0.5">
            Mulai Trial Gratis 14 Hari →
          </Link>
          <p className="mt-4 text-sm text-slate-500">Sudah punya akun? <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Login di sini</Link></p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 py-8 text-center text-sm text-slate-600">
        <p>© {new Date().getFullYear()} XaviKlinika · Sistem Manajemen Klinik Digital</p>
      </footer>
    </main>
  )
}
