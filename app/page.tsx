"use client"

import Link from "next/link"
import { useState } from "react"

const plans = [
  {
    name: "Basic",
    price: "Rp 249.000",
    period: "/bulan",
    setup: "Setup Rp 750.000",
    desc: "Untuk klinik baru mulai digitalisasi",
    color: "border-slate-700/40",
    badge: null,
    features: [
      "Data pasien (maks. 1.000)",
      "5 dokter",
      "Jadwal & booking",
      "Dashboard ringkas",
      "2 user staff",
    ],
  },
  {
    name: "Standard",
    price: "Rp 499.000",
    period: "/bulan",
    setup: "Setup Rp 1.500.000",
    desc: "Operasional lebih rapi & terstruktur",
    color: "border-indigo-500/50",
    badge: "Terpopuler",
    features: [
      "Semua fitur Basic",
      "Antrian pasien loket & poli",
      "Rekam medis elektronik",
      "Pendaftaran BPJS",
      "Laporan operasional",
      "10 user staff",
    ],
  },
  {
    name: "Profesional",
    price: "Rp 899.000",
    period: "/bulan",
    setup: "Setup Rp 3.000.000",
    desc: "Kontrol bisnis klinik profesional",
    color: "border-violet-500/50",
    badge: null,
    features: [
      "Semua fitur Standard",
      "Bridging BPJS lengkap",
      "Kasir & manajemen piutang",
      "Stok obat & farmasi",
      "Laporan keuangan & SLA",
      "Invoice otomatis",
      "50 user staff",
    ],
  },
  {
    name: "Premium",
    price: "Rp 1.500.000",
    period: "/bulan",
    setup: "Setup Rp 5.000.000",
    desc: "Multi cabang & skala penuh",
    color: "border-amber-500/50",
    badge: "Enterprise",
    features: [
      "Semua fitur Pro",
      "Multi cabang",
      "Dashboard advanced",
      "Laporan performa & SLA",
      "Custom workflow",
      "Prioritas support 24/7",
      "Unlimited user staff",
    ],
  },
]

const features = [
  { icon: "👥", title: "Manajemen Pasien", desc: "Data pasien terpusat, riwayat kunjungan, BPJS & rekam medis digital." },
  { icon: "🗓️", title: "Jadwal & Booking", desc: "Jadwal dokter per hari, booking online, konfirmasi otomatis." },
  { icon: "🔢", title: "Antrian Digital", desc: "Nomor antrian loket, poli, apotek. Auto-assign & update real-time." },
  { icon: "📋", title: "Rekam Medis Elektronik", desc: "Catatan diagnosis, resep, vital signs. Cetak e-resep langsung." },
  { icon: "🏥", title: "Bridging BPJS", desc: "Pendaftaran SEP, manajemen klaim, rekap bridging siap integrasi VClaim." },
  { icon: "💊", title: "Stok Obat & Farmasi", desc: "Inventory obat, alert stok menipis, laporan penjualan farmasi." },
  { icon: "💰", title: "Kasir & Piutang", desc: "Tagihan pasien, update status bayar, rekap piutang real-time." },
  { icon: "📊", title: "Laporan Lengkap", desc: "Laporan harian, pendapatan, operasional, SLA, laba-rugi, farmasi." },
  { icon: "🔬", title: "Laboratorium", desc: "Permintaan lab & radiologi, tracking status, input hasil pemeriksaan." },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-[#030712]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black">X</div>
            <span className="text-lg font-bold tracking-tight">XaviKlinika</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-slate-400 sm:flex">
            <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
            <a href="#harga" className="hover:text-white transition-colors">Harga</a>
            <a href="#kontak" className="hover:text-white transition-colors">Kontak</a>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login" className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white transition-all">
              Masuk
            </Link>
            <Link href="/register" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-all">
              Coba Gratis
            </Link>
          </div>
          <button className="sm:hidden text-slate-400" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-800 px-5 py-4 flex flex-col gap-4 sm:hidden">
            <a href="#fitur" className="text-sm text-slate-400" onClick={() => setMenuOpen(false)}>Fitur</a>
            <a href="#harga" className="text-sm text-slate-400" onClick={() => setMenuOpen(false)}>Harga</a>
            <Link href="/login" className="text-sm text-slate-300">Masuk</Link>
            <Link href="/register" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white text-center">Coba Gratis 14 Hari</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-20 pt-20 text-center sm:pt-28">
        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300">
            ✦ Sistem Manajemen Klinik Modern
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Kelola Klinik Lebih{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Cerdas & Efisien
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Dari pendaftaran pasien, antrian, rekam medis, BPJS, farmasi, hingga laporan keuangan — semua dalam satu platform. Mulai gratis 14 hari, tanpa kartu kredit.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register" className="w-full rounded-2xl bg-indigo-600 px-8 py-3.5 text-base font-bold text-white hover:bg-indigo-500 transition-all sm:w-auto">
              Mulai Gratis 14 Hari →
            </Link>
            <Link href="/login" className="w-full rounded-2xl border border-slate-700 px-8 py-3.5 text-base text-slate-300 hover:border-slate-500 transition-all sm:w-auto">
              Sudah punya akun? Masuk
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-600">Tidak perlu kartu kredit · Setup dalam 5 menit · Batalkan kapan saja</p>
        </div>

        {/* Dashboard Preview */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/80 p-4 shadow-2xl ring-1 ring-slate-800/50 backdrop-blur">
            {/* Fake browser bar */}
            <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="mx-auto flex h-6 w-52 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-500">
                klinik.xavindo.com/dashboard
              </div>
            </div>
            {/* Mock dashboard */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Pasien Hari Ini", value: "24", color: "text-indigo-400" },
                { label: "Antrian Aktif", value: "8", color: "text-amber-400" },
                { label: "Pendapatan", value: "Rp 4,2jt", color: "text-emerald-400" },
                { label: "Stok Menipis", value: "3 item", color: "text-red-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-slate-800/60 p-4 text-left border border-slate-700/30">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`mt-1.5 text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="col-span-2 rounded-2xl bg-slate-800/60 border border-slate-700/30 p-4">
                <p className="mb-3 text-xs font-semibold text-slate-400">Kunjungan Minggu Ini</p>
                <div className="flex items-end gap-2 h-16">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-md bg-indigo-500/40" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-xs text-slate-600">
                  {["Sen","Sel","Rab","Kam","Jum","Sab","Min"].map(d => <span key={d}>{d}</span>)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-800/60 border border-slate-700/30 p-4">
                <p className="mb-3 text-xs font-semibold text-slate-400">Antrian Poli</p>
                {[
                  { name: "Ahmad S.", num: "P-001", status: "Sedang" },
                  { name: "Siti R.", num: "P-002", status: "Tunggu" },
                  { name: "Budi H.", num: "P-003", status: "Tunggu" },
                ].map((q) => (
                  <div key={q.num} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-xs font-medium text-slate-300">{q.name}</p>
                      <p className="text-xs text-slate-600">{q.num}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${q.status === "Sedang" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                      {q.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-8 left-0 right-0 h-20 bg-gradient-to-t from-[#030712] to-transparent" />
        </div>
      </section>

      {/* Trusted by / Stats */}
      <section className="border-y border-slate-800/50 bg-slate-900/30 py-10 px-5">
        <div className="mx-auto max-w-4xl grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
          {[
            { value: "15+", label: "Klinik Terdaftar" },
            { value: "98%", label: "Uptime Sistem" },
            { value: "14 Hari", label: "Trial Gratis" },
            { value: "24/7", label: "Support Tim" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Fitur Lengkap</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Semua yang Klinik Anda Butuhkan</h2>
            <p className="mt-3 text-slate-400">Terintegrasi dalam satu platform, tanpa perlu software terpisah.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-3xl border border-slate-800/60 bg-slate-900/50 p-6 hover:border-indigo-500/30 hover:bg-slate-800/40 transition-all">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="font-bold text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="px-5 py-20 bg-slate-900/20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Harga Transparan</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Pilih Paket yang Tepat</h2>
            <p className="mt-3 text-slate-400">Mulai trial gratis 14 hari, upgrade kapan saja sesuai kebutuhan klinik.</p>
          </div>

          {/* Trial Banner */}
          <div className="mb-8 rounded-3xl border border-dashed border-indigo-500/40 bg-indigo-950/20 p-6 text-center">
            <p className="text-2xl font-black text-white">🎁 Trial Gratis 14 Hari</p>
            <p className="mt-2 text-slate-400">Akses semua fitur tanpa batasan. Tidak perlu kartu kredit.</p>
            <Link href="/register" className="mt-4 inline-block rounded-2xl bg-indigo-600 px-8 py-3 font-bold text-white hover:bg-indigo-500 transition-all">
              Mulai Trial Sekarang →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <div key={p.name} className={`relative rounded-3xl border bg-slate-900/50 p-6 flex flex-col ${p.color} ${p.badge === "Terpopuler" ? "ring-1 ring-indigo-500/50" : ""}`}>
                {p.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold ${p.badge === "Terpopuler" ? "bg-indigo-600 text-white" : "bg-amber-600 text-white"}`}>
                    {p.badge}
                  </span>
                )}
                <div>
                  <h3 className="font-bold text-white">{p.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{p.desc}</p>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-white">{p.price}</span>
                    <span className="text-sm text-slate-500">{p.period}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{p.setup}</p>
                </div>
                <ul className="mt-5 flex flex-col gap-2 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="mt-0.5 text-indigo-400 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/register?plan=${p.name.toLowerCase() === "profesional" ? "pro" : p.name.toLowerCase()}`} className={`mt-6 block rounded-2xl py-2.5 text-center text-sm font-semibold transition-all ${p.badge === "Terpopuler" ? "bg-indigo-600 text-white hover:bg-indigo-500" : "border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"}`}>
                  Pilih {p.name}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-600">Semua harga belum termasuk PPN. Harga setup dibayar sekali.</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Testimoni</p>
            <h2 className="mt-2 text-3xl font-black text-white">Dipercaya Klinik di Seluruh Indonesia</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { name: "Dr. Andi Kurniawan", role: "Pemilik Klinik Sehat Bersama, Jakarta", quote: "Antrian dan rekam medis jadi jauh lebih rapi. Staff saya tidak perlu bolak-balik cari data pasien lagi." },
              { name: "Sinta Rahayu", role: "Manajer Operasional, Klinik Pratama Maju", quote: "Laporan keuangan bulanan yang dulu butuh 2 hari sekarang langsung otomatis. Sangat membantu!" },
              { name: "Dr. Hendra S., Sp.PD", role: "Klinik Spesialis Medika, Surabaya", quote: "BPJS bridging dan e-resep terintegrasi, pasien kami puas dengan pelayanan yang lebih cepat." },
            ].map((t) => (
              <div key={t.name} className="rounded-3xl border border-slate-800/60 bg-slate-900/50 p-6">
                <p className="text-sm leading-relaxed text-slate-300">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 border-t border-slate-800 pt-4">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20">
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-indigo-500/30 bg-indigo-950/30 p-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-violet-600/10" />
          <div className="relative">
            <h2 className="text-3xl font-black text-white">Siap Digitalisasi Klinik Anda?</h2>
            <p className="mt-3 text-slate-400">Daftar sekarang dan nikmati trial gratis 14 hari. Tidak perlu kartu kredit.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/register" className="rounded-2xl bg-indigo-600 px-8 py-3.5 font-bold text-white hover:bg-indigo-500 transition-all">
                Daftar Sekarang — Gratis →
              </Link>
              <a href="https://wa.me/6208139536886" target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-700 px-8 py-3.5 text-slate-300 hover:border-slate-500 transition-all">
                💬 Hubungi Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="border-t border-slate-800/60 px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black">X</div>
                <span className="text-lg font-bold">XaviKlinika</span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs">Sistem manajemen klinik modern untuk Indonesia. Dikembangkan oleh tim Xavindo.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <p className="font-semibold text-white mb-3">Produk</p>
                <ul className="space-y-2 text-slate-500">
                  <li><a href="#fitur" className="hover:text-white transition-colors">Fitur</a></li>
                  <li><a href="#harga" className="hover:text-white transition-colors">Harga</a></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Daftar Trial</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white mb-3">Kontak</p>
                <ul className="space-y-2 text-slate-500">
                  <li>hello@xavindo.com</li>
                  <li><a href="https://wa.me/6208139536886" className="hover:text-white transition-colors">WhatsApp</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-6 flex flex-col gap-2 sm:flex-row sm:justify-between text-xs text-slate-600">
            <p>© 2026 XaviKlinika by Xavindo. Hak cipta dilindungi.</p>
            <p>Made with ♥ for Indonesian clinics</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
