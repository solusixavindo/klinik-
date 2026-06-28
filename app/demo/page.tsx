"use client"

import Link from "next/link"
import type React from "react"
import { useMemo, useState } from "react"
import { PLANS, type PlanCode } from "@/lib/billing"
import { demoDoctors, demoInvoices, demoPatients, demoSchedules, demoStockItems, getDemoBookings, getDemoDashboard } from "@/lib/demoData"

type Menu = "Dashboard" | "Pasien" | "Dokter" | "Jadwal" | "Booking" | "Antrian" | "Rekam Medis" | "Invoice" | "Keuangan" | "Stok Obat" | "Laboratorium" | "Staff" | "Pengaturan Klinik"
type RowData = { title: string; meta: string; tag?: string }

// Module-level mutable ref so demoClick (used in sub-components) can trigger modal state in DemoPage
let _openDemoModal: (() => void) | undefined
const demoClick = () => _openDemoModal?.()

const menus: { label: Menu; icon: string; level: PlanCode }[] = [
  { label: "Dashboard", icon: "▦", level: "basic" },
  { label: "Pasien", icon: "◇", level: "basic" },
  { label: "Dokter", icon: "▧", level: "basic" },
  { label: "Jadwal", icon: "▤", level: "basic" },
  { label: "Booking", icon: "▥", level: "standard" },
  { label: "Antrian", icon: "◌", level: "standard" },
  { label: "Rekam Medis", icon: "▣", level: "standard" },
  { label: "Invoice", icon: "▩", level: "pro" },
  { label: "Keuangan", icon: "▨", level: "pro" },
  { label: "Stok Obat", icon: "△", level: "pro" },
  { label: "Laboratorium", icon: "◫", level: "pro" },
  { label: "Staff", icon: "◈", level: "premium" },
  { label: "Pengaturan Klinik", icon: "⚙", level: "premium" },
]
const planRank: Record<PlanCode, number> = { trial: 1, basic: 1, standard: 2, pro: 3, premium: 4 }
const demoPlans: PlanCode[] = ["basic", "standard", "pro", "premium"]
const revenueBars = [48, 54, 61, 58, 73, 86, 92, 96]
const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu"]
const fmt = (value: number) => `Rp ${value.toLocaleString("id-ID")}`
const topServices = [
  ["Konsultasi Umum", "126 kunjungan", 18900000],
  ["Pemeriksaan Gigi", "84 tindakan", 25200000],
  ["Imunisasi Anak", "51 kunjungan", 15300000],
  ["Medical Check Up", "28 paket", 19600000],
] as const
const labRows: RowData[] = [
  { title: "Ahmad Santoso · Darah Lengkap", meta: "Estimasi selesai 14:20", tag: "Menunggu" },
  { title: "Siti Rahma · Gula Darah Puasa", meta: "102 mg/dL", tag: "Selesai" },
  { title: "Budi Hartono · Radiologi Thorax", meta: "Menunggu validasi dokter", tag: "Review" },
]
const staffRows: RowData[] = [
  { title: "Nadia Pratama", meta: "Admin · shift 07:00-15:00", tag: "Aktif" },
  { title: "Raka Wibowo", meta: "Kasir · shift 08:00-16:00", tag: "Aktif" },
  { title: "Maya Putri", meta: "Dokter · shift 09:00-14:00", tag: "Aktif" },
  { title: "Sinta Laras", meta: "Perawat · shift 10:00-18:00", tag: "Aktif" },
]
const recordRows: RowData[] = [
  { title: "Ahmad Santoso · ISPA ringan", meta: "Nebulisasi dan edukasi · Resep Paracetamol, Cetirizine · dr. Maya Putri", tag: "Tersimpan" },
  { title: "Siti Rahma · Kontrol gigi", meta: "Scaling · Antiseptic mouthwash · drg. Raka Aditya", tag: "Tersimpan" },
  { title: "Budi Hartono · Demam anak", meta: "Observasi suhu · Paracetamol syrup · dr. Lina Kartika", tag: "Tersimpan" },
]

export default function DemoPage() {
  const [activeMenu, setActiveMenu] = useState<Menu>("Dashboard")
  const [plan, setPlan] = useState<PlanCode>(() => {
    if (typeof window === "undefined") return "premium"
    const queryPlan = new URLSearchParams(window.location.search).get("plan") as PlanCode | null
    return queryPlan && demoPlans.includes(queryPlan) ? queryPlan : "premium"
  })
  const [showModal, setShowModal] = useState(false)
  _openDemoModal = () => setShowModal(true)

  const data = useMemo(() => getDemoDashboard(plan), [plan])
  const bookings = useMemo(() => getDemoBookings(), [])
  const selectedPlan = PLANS[plan]

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#172554_0,#020617_38%,#111827_100%)] text-slate-100">
      {showModal && <DemoModal onClose={() => setShowModal(false)} />}

      {/* Sticky top conversion bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-indigo-500/20 bg-slate-950/90 px-4 py-2.5 backdrop-blur-xl">
        <p className="text-xs font-medium text-slate-300">
          <span className="hidden sm:inline">Anda sedang melihat demo interaktif XaviKlinika. </span>
          <span className="text-amber-300 font-semibold">Gratis 14 hari</span> — tidak perlu kartu kredit.
        </p>
        <Link href="/register" className="shrink-0 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition">
          Daftar Gratis →
        </Link>
      </div>

      <div className="grid min-h-screen lg:grid-cols-[310px_1fr]">
        <aside className="hidden border-r border-slate-700/30 bg-slate-950/75 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl lg:flex lg:flex-col">
          <Brand />
          <div className="mt-7 rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 to-cyan-500/10 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Paket Preview</p>
            <select value={plan} onChange={(e) => setPlan(e.target.value as PlanCode)} className="mt-3 w-full rounded-2xl border border-slate-700/50 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none">
              {demoPlans.map((item) => <option key={item} value={item}>{PLANS[item].name}</option>)}
            </select>
            <p className="mt-2 text-xs text-slate-400">{selectedPlan.priceLabel}</p>
          </div>
          <nav className="mt-7 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {menus.map((item) => {
              const active = activeMenu === item.label
              const included = planRank[plan] >= planRank[item.level]
              return (
                <button key={item.label} type="button" onClick={() => setActiveMenu(item.label)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${active ? "border border-indigo-400/40 bg-indigo-500/25 text-white shadow-lg shadow-indigo-900/20" : "text-slate-300 hover:bg-slate-800/60"}`}>
                  <span className="w-5 text-center text-indigo-300">{item.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {!included && <Badge tone="amber">Upgrade</Badge>}
                </button>
              )
            })}
          </nav>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <Header activeMenu={activeMenu} />
          <select value={activeMenu} onChange={(e) => setActiveMenu(e.target.value as Menu)} className="mb-5 w-full rounded-2xl border border-slate-700/50 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none lg:hidden">
            {menus.map((item) => <option key={item.label}>{item.label}</option>)}
          </select>
          {content(activeMenu, data, bookings, selectedPlan)}
        </section>
      </div>
    </main>
  )
}

function content(menu: Menu, data: ReturnType<typeof getDemoDashboard>, bookings: ReturnType<typeof getDemoBookings>, selectedPlan: (typeof PLANS)[PlanCode]) {
  if (menu === "Dashboard") return <Dashboard data={data} bookings={bookings} />
  if (menu === "Pasien") return <Patients />
  if (menu === "Dokter") return <Doctors />
  if (menu === "Jadwal") return <Rows title="Kalender Jadwal Dokter" action="Tambah Jadwal" rows={demoSchedules.map((s, i) => ({ title: `${s.day}, ${s.start_time}-${s.end_time}`, meta: `${s.doctors.name} · kuota ${[24, 18, 20][i]} pasien`, tag: s.doctors.specialization }))} />
  if (menu === "Booking") return <Rows title="Booking Hari Ini" action="Tambah Booking" rows={bookings.map((b, i) => ({ title: b.patients.name, meta: `${b.doctors.name} · ${b.visit_date} · ${fmt(b.price)}`, tag: ["Menunggu", "Selesai", "Batal"][i] }))} />
  if (menu === "Antrian") return <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]"><Panel title="Nomor Antrian" action="Live"><QueueStats data={data} /></Panel><QueuePanel data={data} /></div>
  if (menu === "Rekam Medis") return <Rows title="Rekam Medis Elektronik" action="Tambah Catatan" rows={recordRows} />
  if (menu === "Invoice") return <Invoice />
  if (menu === "Keuangan") return <Finance />
  if (menu === "Stok Obat") return <Stock />
  if (menu === "Laboratorium") return <Rows title="Permintaan Laboratorium" action="Update Hasil" rows={labRows} />
  if (menu === "Staff") return <Rows title="Staff Aktif Hari Ini" action="Tambah Staff" rows={staffRows} />
  return <Settings selectedPlan={selectedPlan} />
}

function Header({ activeMenu }: { activeMenu: Menu }) {
  return (
    <header className="mb-6 rounded-[28px] border border-slate-700/30 bg-slate-900/55 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">XaviKlinika</p>
              <Badge tone="amber">Demo Interaktif</Badge>
              <Badge tone="emerald">Data Simulasi</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">{activeMenu}</h1>
            <p className="mt-1 text-sm text-slate-400">Klinik Sehat Sentosa, operasional premium dalam satu layar.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={demoClick} className="btn-primary text-sm">+ Tambah Data</button>
          <button type="button" onClick={demoClick} className="btn-secondary text-sm">Export Laporan</button>
          <Link href="/register" className="btn-primary text-sm">Mulai Trial Gratis</Link>
        </div>
      </div>
    </header>
  )
}

function Dashboard({ data, bookings }: { data: ReturnType<typeof getDemoDashboard>; bookings: ReturnType<typeof getDemoBookings> }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Stat label="Total Pasien" value="1.248" note="+214 bulan ini" tone="text-emerald-300" />
        <Stat label="Booking Hari Ini" value="32" note="24 selesai" tone="text-sky-300" />
        <Stat label="Pendapatan Bulan Ini" value="Rp 86,5jt" note="+16% vs bulan lalu" tone="text-indigo-300" />
        <Stat label="Stok Menipis" value="8 item" note="perlu restock" tone="text-amber-300" />
        <Stat label="Dokter Aktif" value="12" note="4 poli aktif" tone="text-cyan-300" />
        <Stat label="Invoice Terbayar" value="184" note={fmt(42600000)} tone="text-fuchsia-300" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Owner Dashboard" action={<button onClick={demoClick}>Lihat Laporan</button>}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Pendapatan Hari Ini", "Rp 12,6jt", "32 transaksi tercatat", "text-emerald-300"],
              ["Pendapatan Bulan Ini", "Rp 86,5jt", "+16% dibanding bulan lalu", "text-indigo-300"],
              ["Invoice Outstanding", "Rp 18,4jt", "27 invoice perlu follow up", "text-amber-300"],
              ["Staff Aktif Hari Ini", "18 orang", "4 poli dan kasir aktif", "text-cyan-300"],
            ].map(([label, value, note, tone]) => <Stat key={label} label={label} value={value} note={note} tone={tone} compact />)}
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Ranking title="Top Layanan" items={topServices} />
            <Ranking title="Top Dokter" items={data.top_doctors.map((d) => [d.name, `${d.bookings} pasien`, d.revenue] as const)} />
          </div>
        </Panel>
        <Panel title="Operasional Hari Ini" action={<button onClick={demoClick}>Pantau Live</button>}>
          {[
            ["Booking Hari Ini", "32", "24 selesai, 8 berjalan"],
            ["Antrian Aktif", "8", "5 menunggu, 2 dipanggil, 1 dilayani"],
            ["Pasien Menunggu", "5", "Estimasi antrean 18 menit"],
          ].map(([label, value, note]) => <Metric key={label} label={label} value={value} note={note} />)}
        </Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Revenue data={data} />
        <QueuePanel data={data} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Rows title="Booking Hari Ini" action="Tambah Booking" rows={bookings.map((b) => ({ title: b.patients.name, meta: `${b.doctors.name} · ${fmt(b.price)}`, tag: b.payment_status }))} />
        <Rows title="Stok Menipis" action="Restock" rows={stockRows()} />
        <Rows title="Invoice Terbaru" action="Cetak" rows={invoiceRows()} />
      </div>
    </div>
  )
}

function Patients() {
  return (
    <Panel title="Database Pasien" action={<button onClick={demoClick}>Tambah Pasien</button>}>
      <div className="mb-4 rounded-2xl border border-slate-700/30 bg-slate-950/30 px-4 py-3 text-sm text-slate-400">Cari pasien: Ahmad, Siti, Budi</div>
      <Table headers={["Nama", "Usia", "Gender", "Nomor HP", "Status", "Aksi"]} rows={demoPatients.map((p, i) => [p.name, `${[38, 31, 46][i]} tahun`, p.gender, p.phone, <Badge key="s" tone={i === 0 ? "emerald" : "indigo"}>{i === 0 ? "Kontrol" : "Aktif"}</Badge>, <button key="d" onClick={demoClick} className="font-bold text-indigo-300">Detail</button>])} />
    </Panel>
  )
}

function Doctors() {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {demoDoctors.map((d, i) => (
        <Panel key={d.id} title={d.name} action={<Badge tone="emerald">Aktif</Badge>}>
          <p className="text-sm text-slate-400">{d.specialization}</p>
          <p className="mt-3 text-3xl font-bold text-white">{[46, 31, 28][i]}</p>
          <p className="text-sm text-slate-500">pasien bulan ini</p>
          <Metric label="Jadwal Praktik" value={["Senin-Jumat", "Rabu-Sabtu", "Selasa-Kamis"][i]} note={["08:00-14:00", "09:00-15:00", "10:00-16:00"][i]} />
          <button onClick={demoClick} className="btn-secondary mt-5 w-full">Lihat Profil</button>
        </Panel>
      ))}
    </div>
  )
}

function Invoice() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Rows title="Daftar Invoice" action="Buat Invoice" rows={invoiceRows()} />
      <Panel title="Preview Invoice Profesional" action={<button onClick={demoClick}>Cetak Invoice</button>}>
        <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3"><Logo light /><div><p className="text-lg font-black">Klinik Sehat Sentosa</p><p className="text-xs text-slate-500">Jl. Merdeka No. 18, Jakarta</p></div></div>
            <div className="text-right"><p className="text-xs font-bold text-indigo-700">INVOICE</p><p className="text-sm font-bold">INV-2026-184</p></div>
          </div>
          {[["Pasien", "Ahmad Santoso"], ["Konsultasi Dokter", fmt(150000)], ["Obat dan tindakan", fmt(125000)], ["Total", fmt(275000)]].map(([label, value], i) => <div key={label} className={`mt-3 flex justify-between text-sm ${i === 3 ? "border-t border-slate-200 pt-3 text-lg font-black" : ""}`}><span>{label}</span><span className="font-bold">{value}</span></div>)}
          <div className="mt-6 flex gap-3"><button onClick={demoClick} className="flex-1 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white">Cetak Invoice</button><button onClick={demoClick} className="flex-1 rounded-2xl border border-slate-300 py-3 text-sm font-bold">Kirim WhatsApp</button></div>
        </div>
      </Panel>
    </div>
  )
}

function Finance() {
  return <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><Panel title="Grafik Pendapatan" action={<button onClick={demoClick}>Export</button>}><BarChart /></Panel><Rows title="Transaksi Terakhir" action="Rekonsiliasi" rows={[{ title: "QRIS", meta: "86 transaksi hari ini", tag: fmt(18400000) }, { title: "Tunai", meta: "44 transaksi hari ini", tag: fmt(9200000) }, { title: "Transfer", meta: "18 transaksi hari ini", tag: fmt(6400000) }, { title: "Outstanding", meta: "27 invoice perlu follow up", tag: fmt(18400000) }]} /></div>
}

function Stock() {
  return <Panel title="Stok Obat dan Alkes" action={<button onClick={demoClick}>Tambah Obat</button>}><Table headers={["Nama", "Stok", "Min", "Expired", "Harga", "Status"]} rows={demoStockItems.map((s, i) => [s.name, `${s.stock} ${s.unit}`, `${s.min_stock} ${s.unit}`, ["2027-04-12", "2026-07-18", "2028-01-06", "2026-07-02"][i], fmt(s.sell_price), <Badge key="b" tone={s.stock <= s.min_stock ? "amber" : "emerald"}>{s.stock <= s.min_stock ? "Menipis" : "Aman"}</Badge>])} /></Panel>
}

function Settings({ selectedPlan }: { selectedPlan: (typeof PLANS)[PlanCode] }) {
  return (
    <Panel title="Pengaturan Klinik" action={<button onClick={demoClick}>Simpan</button>}>
      <div className="grid gap-6 lg:grid-cols-[160px_1fr]">
        <div className="rounded-3xl border border-slate-700/30 bg-slate-950/30 p-5 text-center"><Logo large /><button onClick={demoClick} className="btn-secondary mt-5 w-full">Upload Logo</button></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Klinik" value="Klinik Sehat Sentosa" /><Field label="Nomor WhatsApp" value="0812-3456-7000" /><Field label="Alamat" value="Jl. Merdeka No. 18, Jakarta" /><Field label="Paket Aktif" value={selectedPlan.name} /><Field label="Warna Branding" value="Indigo, Emerald, Slate" /><Field label="Booking Online" value="Aktif" />
        </div>
      </div>
    </Panel>
  )
}

function Revenue({ data }: { data: ReturnType<typeof getDemoDashboard> }) {
  return <Panel title="Revenue & Kunjungan" action={<button onClick={demoClick}>Export</button>}><div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><BarChart /><div className="space-y-3">{data.booking_status.map((s) => <div key={s.label} className="rounded-2xl border border-slate-700/20 bg-slate-950/30 p-4"><div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-white">{s.label}</span><span className="text-slate-400">{s.value}%</span></div><div className="h-2 rounded-full bg-slate-800"><div className={`h-2 rounded-full ${s.color}`} style={{ width: `${s.value}%` }} /></div></div>)}</div></div></Panel>
}

function QueuePanel({ data }: { data: ReturnType<typeof getDemoDashboard> }) {
  return <Panel title="Antrian Hari Ini" action="Live"><div className="space-y-3">{data.queue_entries.map((q) => <Row key={q.id} title={q.patients?.name ?? "Pasien"} meta={q.doctors?.name ?? "Dokter"} tag={q.status} />)}</div></Panel>
}

function QueueStats({ data }: { data: ReturnType<typeof getDemoDashboard> }) {
  return <div className="grid grid-cols-3 gap-3"><QueueMetric label="Menunggu" value={data.queue_now.waiting} /><QueueMetric label="Dipanggil" value={data.queue_now.called} /><QueueMetric label="Dilayani" value={data.queue_now.serving} /></div>
}

function Rows({ title, rows, action }: { title: string; rows: RowData[]; action?: string }) {
  return <Panel title={title} action={action ? <button onClick={demoClick}>{action}</button> : undefined}><div className="space-y-3">{rows.map((row) => <Row key={`${row.title}-${row.meta}`} {...row} />)}</div></Panel>
}

function stockRows(): RowData[] {
  return demoStockItems.map((s) => ({ title: s.name, meta: `${s.stock} ${s.unit} tersedia · min ${s.min_stock}`, tag: fmt(s.sell_price) }))
}

function invoiceRows(): RowData[] {
  return demoInvoices.map((i) => ({ title: i.id, meta: `${i.patient_name} · ${i.date}`, tag: fmt(i.amount) }))
}

function Brand() {
  return <div className="flex items-center gap-3"><Logo /><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Klinik Sehat Sentosa</p><p className="mt-1 text-sm font-semibold text-white">Demo Premium</p></div></div>
}

function Logo({ light = false, large = false }: { light?: boolean; large?: boolean }) {
  return <div className={`${large ? "mx-auto h-24 w-24 text-4xl" : "h-12 w-12 text-lg"} flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-sky-500 to-indigo-600 font-black text-white shadow-lg shadow-indigo-600/20 ${light ? "shadow-none" : ""}`}>SS</div>
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-[28px] border border-slate-700/30 bg-slate-900/55 p-5 shadow-xl shadow-black/20 backdrop-blur-xl"><div className="mb-4 flex items-center justify-between gap-4"><h2 className="font-bold text-white">{title}</h2>{action && <div className="text-xs font-semibold text-indigo-300">{action}</div>}</div>{children}</section>
}

function Stat({ label, value, note, tone, compact = false }: { label: string; value: string; note: string; tone: string; compact?: boolean }) {
  return <div className="rounded-[26px] border border-slate-700/30 bg-slate-950/30 p-4"><p className="text-xs font-semibold text-slate-400">{label}</p><p className={`mt-2 font-bold ${tone} ${compact ? "text-xl" : "text-2xl"}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div>
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="mt-3 rounded-2xl border border-slate-700/20 bg-slate-950/30 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-300">{label}</p><p className="text-2xl font-bold text-white">{value}</p></div><p className="mt-1 text-xs text-slate-500">{note}</p></div>
}

function QueueMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-700/20 bg-slate-950/30 p-4 text-center"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-3xl font-bold text-white">{value}</p></div>
}

function Ranking({ title, items }: { title: string; items: readonly (readonly [string, string, number])[] }) {
  return <div className="rounded-2xl border border-slate-700/20 bg-slate-950/30 p-4"><p className="mb-3 text-sm font-bold text-white">{title}</p><div className="space-y-3">{items.map(([label, value, amount], i) => <div key={label} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-200">{i + 1}. {label}</p><p className="text-xs text-slate-500">{value}</p></div><span className="shrink-0 text-xs font-bold text-emerald-300">{fmt(amount)}</span></div>)}</div></div>
}

function Row({ title, meta, tag }: RowData) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/20 bg-slate-950/30 p-4"><div className="min-w-0"><p className="truncate font-semibold text-slate-100">{title}</p><p className="mt-1 truncate text-sm text-slate-400">{meta}</p></div>{tag && <Badge tone="indigo">{tag}</Badge>}</div>
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-700/30 bg-slate-950/30 px-4 py-3"><p className="text-xs uppercase tracking-widest text-slate-500">{label}</p><p className="mt-1 font-semibold text-white">{value}</p></div>
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "emerald" | "amber" | "indigo" }) {
  const colors = { emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200", amber: "border-amber-400/30 bg-amber-400/10 text-amber-200", indigo: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200" }
  return <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${colors[tone]}`}>{children}</span>
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return <div className="overflow-x-auto rounded-2xl border border-slate-700/30"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-950/50 text-xs uppercase tracking-widest text-slate-500"><tr>{headers.map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-800/80">{rows.map((row, i) => <tr key={i} className="bg-slate-900/30 text-slate-200">{row.map((cell, j) => <td key={j} className="px-4 py-4">{cell}</td>)}</tr>)}</tbody></table></div>
}

function BarChart() {
  return <div className="flex h-72 items-end gap-3 rounded-2xl border border-slate-700/20 bg-slate-950/30 p-4">{revenueBars.map((value, i) => <div key={months[i]} className="flex h-full flex-1 flex-col justify-end gap-2"><div className="flex flex-1 items-end rounded-xl bg-slate-900/70 p-1"><div className="w-full rounded-lg bg-gradient-to-t from-indigo-600 via-sky-500 to-emerald-300 shadow-lg shadow-indigo-600/20" style={{ height: `${value}%` }} /></div><span className="text-center text-xs text-slate-500">{months[i]}</span></div>)}</div>
}

function DemoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 shadow-2xl shadow-indigo-900/40">
        <button onClick={onClose} className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-800 hover:text-white">✕</button>
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400 text-2xl shadow-lg shadow-indigo-600/30">✦</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Mode Demo</p>
            <h2 className="text-xl font-bold text-white">Aktifkan Fitur Ini</h2>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">
          Anda sedang melihat <span className="font-semibold text-white">simulasi data</span>. Daftar sekarang untuk menggunakan XaviKlinika dengan data nyata klinik Anda — gratis 14 hari, tanpa kartu kredit.
        </p>
        <ul className="mt-5 space-y-2 text-sm text-slate-400">
          <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Semua fitur aktif sejak hari pertama</li>
          <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Data real klinik Anda, aman dan terenkripsi</li>
          <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Aktif dalam 5 menit, tanpa instalasi</li>
        </ul>
        <div className="mt-7 flex flex-col gap-3">
          <Link href="/register" onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50">
            ✦ Mulai Trial Gratis 14 Hari
          </Link>
          <Link href="/register" onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700/60 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/50 hover:text-white">
            Lihat Semua Paket →
          </Link>
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">Tidak perlu kartu kredit · Aktif dalam 5 menit</p>
      </div>
    </div>
  )
}
