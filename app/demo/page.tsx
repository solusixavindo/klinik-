"use client"

import Link from "next/link"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { PLANS, type PlanCode } from "@/lib/billing"
import {
  demoInvoices,
  demoPatients,
  demoSchedules,
  demoStockItems,
  getDemoBookings,
  getDemoDashboard,
} from "@/lib/demoData"

type DemoMenuItem = {
  label: string
  icon: string
  level: PlanCode
}

const demoPlans: PlanCode[] = ["basic", "standard", "pro", "premium"]
const demoActionMessage = "Mode demo: data tidak disimpan. Mulai trial gratis untuk menggunakan fitur ini."

const planRank: Record<PlanCode, number> = {
  trial: 1,
  basic: 1,
  standard: 2,
  pro: 3,
  premium: 4,
}

const menuItems: DemoMenuItem[] = [
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

const monthlyRevenue = [
  { label: "Jan", value: 48 },
  { label: "Feb", value: 54 },
  { label: "Mar", value: 61 },
  { label: "Apr", value: 58 },
  { label: "Mei", value: 73 },
  { label: "Jun", value: 86 },
  { label: "Jul", value: 92 },
  { label: "Agu", value: 96 },
]

const formatRp = (value: number) => `Rp ${value.toLocaleString("id-ID")}`

export default function DemoPage() {
  const [plan, setPlan] = useState<PlanCode>("premium")
  const data = useMemo(() => getDemoDashboard(plan), [plan])
  const bookings = useMemo(() => getDemoBookings(), [])
  const selectedPlan = PLANS[plan]

  const handleDemoAction = () => {
    alert(demoActionMessage)
  }

  useEffect(() => {
    const planFromUrl = new URLSearchParams(window.location.search).get("plan") as PlanCode | null
    if (planFromUrl && demoPlans.includes(planFromUrl)) {
      setPlan(planFromUrl)
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[300px_1fr]">
        <aside className="hidden border-r border-slate-700/30 bg-slate-950/70 p-6 backdrop-blur-xl lg:flex lg:flex-col">
          <ClinicBrand />

          <div className="mt-7 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Paket Preview</p>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as PlanCode)}
              className="mt-3 w-full rounded-xl border border-slate-700/50 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none"
            >
              {demoPlans.map((item) => (
                <option key={item} value={item}>{PLANS[item].name}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-400">{selectedPlan.priceLabel}</p>
          </div>

          <nav className="mt-7 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {menuItems.map((item) => {
              const active = planRank[plan] >= planRank[item.level]
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={handleDemoAction}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    item.label === "Dashboard"
                      ? "border border-indigo-500/30 bg-indigo-600/20 text-indigo-200"
                      : "text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  <span className="w-5 text-center text-indigo-300">{item.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {!active && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                      Pro
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-slate-700/30 bg-slate-900/50 p-4">
            <p className="text-sm font-bold text-white">Demo Mode</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Data simulasi untuk melihat alur produk sebelum memulai trial.</p>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-6 rounded-3xl border border-slate-700/30 bg-slate-900/55 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div className="lg:hidden">
                  <ClinicLogo />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">XaviKlinika</p>
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-200">
                      Demo Mode
                    </span>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-200">
                      Data simulasi
                    </span>
                  </div>
                  <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Dashboard Klinik Sehat Sentosa</h1>
                  <p className="mt-1 text-sm text-slate-400">Preview operasional klinik modern dalam satu dashboard.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleDemoAction} className="btn-primary text-sm">+ Tambah Pasien</button>
                <button type="button" onClick={handleDemoAction} className="btn-secondary text-sm">Export Laporan</button>
                <Link href="/register" className="btn-primary text-sm">Mulai Trial Gratis</Link>
              </div>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard label="Total Pasien" value="1.248" note="+214 bulan ini" tone="text-emerald-300" />
            <StatCard label="Booking Hari Ini" value="32" note="24 selesai" tone="text-sky-300" />
            <StatCard label="Pendapatan Bulan Ini" value="Rp 86,5jt" note="+16% vs bulan lalu" tone="text-indigo-300" />
            <StatCard label="Stok Menipis" value="8 item" note="perlu restock" tone="text-amber-300" />
            <StatCard label="Dokter Aktif" value="12" note="4 poli aktif" tone="text-cyan-300" />
            <StatCard label="Invoice Terbayar" value="184" note={formatRp(42600000)} tone="text-fuchsia-300" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <Panel title="Revenue & Kunjungan" action={<button onClick={handleDemoAction} className="text-xs font-semibold text-indigo-300">Export</button>}>
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <div className="flex h-64 items-end gap-3 rounded-2xl border border-slate-700/20 bg-slate-950/30 p-4">
                    {monthlyRevenue.map((item) => (
                      <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                        <div className="flex flex-1 items-end rounded-xl bg-slate-900/70 p-1">
                          <div
                            className="w-full rounded-lg bg-gradient-to-t from-indigo-600 via-sky-500 to-emerald-300 shadow-lg shadow-indigo-600/20"
                            style={{ height: `${item.value}%` }}
                          />
                        </div>
                        <span className="text-center text-xs text-slate-500">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {data.booking_status.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-700/20 bg-slate-950/30 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-white">{item.label}</span>
                        <span className="text-slate-400">{item.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800">
                        <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Antrian Hari Ini" action="Live">
              <div className="grid grid-cols-3 gap-3">
                <QueueMetric label="Menunggu" value={data.queue_now.waiting} />
                <QueueMetric label="Dipanggil" value={data.queue_now.called} />
                <QueueMetric label="Dilayani" value={data.queue_now.serving} />
              </div>
              <div className="mt-4 space-y-3">
                {data.queue_entries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-700/20 bg-slate-950/30 p-4">
                    <p className="font-semibold text-white">{entry.patients?.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{entry.doctors?.name}</p>
                    <span className="mt-3 inline-flex rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200">
                      {entry.status}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <Panel title="Booking Hari Ini" action={<button onClick={handleDemoAction} className="text-xs font-semibold text-indigo-300">Tambah Booking</button>}>
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <Row
                    key={booking.id}
                    title={booking.patients.name}
                    meta={`${booking.doctors.name} · ${formatRp(booking.price)}`}
                    tag={booking.payment_status}
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Pasien Terbaru" action={<button onClick={handleDemoAction} className="text-xs font-semibold text-indigo-300">Tambah Pasien</button>}>
              <div className="space-y-3">
                {demoPatients.map((patient) => (
                  <Row key={patient.id} title={patient.name} meta={`${patient.phone} · ${patient.gender}`} tag="Baru" />
                ))}
              </div>
            </Panel>

            <Panel title="Jadwal Dokter" action="Hari ini">
              <div className="space-y-3">
                {demoSchedules.map((schedule) => (
                  <Row
                    key={schedule.id}
                    title={schedule.doctors.name}
                    meta={`${schedule.day}, ${schedule.start_time}-${schedule.end_time}`}
                    tag={schedule.doctors.specialization}
                  />
                ))}
              </div>
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Panel title="Stok Obat Menipis" action={<button onClick={handleDemoAction} className="text-xs font-semibold text-indigo-300">Restock</button>}>
              <div className="space-y-3">
                {demoStockItems.map((item) => (
                  <Row key={item.id} title={item.name} meta={`${item.stock} ${item.unit} tersedia · min ${item.min_stock}`} tag={formatRp(item.sell_price)} />
                ))}
              </div>
            </Panel>

            <Panel title="Invoice & Branding" action={<button onClick={handleDemoAction} className="text-xs font-semibold text-indigo-300">Cetak Invoice</button>}>
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-3">
                  {demoInvoices.map((invoice) => (
                    <Row key={invoice.id} title={invoice.id} meta={`${invoice.patient_name} · ${formatRp(invoice.amount)}`} tag={invoice.status} />
                  ))}
                </div>
                <div className="rounded-2xl border border-slate-700/30 bg-white p-5 text-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      <ClinicLogo light />
                      <div>
                        <p className="font-bold">Klinik Sehat Sentosa</p>
                        <p className="text-xs text-slate-500">Jl. Merdeka No. 18, Jakarta</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-indigo-700">INVOICE</p>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Pasien</span><b>Ahmad Santoso</b></div>
                    <div className="flex justify-between"><span>Layanan</span><b>Konsultasi Dokter</b></div>
                    <div className="flex justify-between"><span>Total</span><b>{formatRp(275000)}</b></div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button onClick={handleDemoAction} className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white">Cetak</button>
                    <button onClick={handleDemoAction} className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold">Kirim WA</button>
                  </div>
                  <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-slate-400">Powered by Xavindo</p>
                </div>
              </div>
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Panel title="Aktivitas Staff" action="Realtime">
              <div className="space-y-3">
                {data.staff_activities.map((item) => (
                  <Row key={item.id} title={item.name} meta={item.action} tag={item.time} />
                ))}
              </div>
            </Panel>

            <Panel title="Pengaturan & Branding" action={<button onClick={handleDemoAction} className="text-xs font-semibold text-indigo-300">Simpan</button>}>
              <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                <div className="rounded-2xl border border-slate-700/30 bg-slate-950/30 p-4 text-center">
                  <ClinicLogo large />
                  <button onClick={handleDemoAction} className="mt-4 rounded-xl border border-slate-700/40 px-3 py-2 text-xs font-semibold text-slate-300">
                    Upload Logo
                  </button>
                </div>
                <div className="space-y-3">
                  <Field label="Nama Klinik" value="Klinik Sehat Sentosa" />
                  <Field label="Alamat" value="Jl. Merdeka No. 18, Jakarta" />
                  <Field label="Paket Aktif" value={selectedPlan.name} />
                </div>
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  )
}

function ClinicBrand() {
  return (
    <div className="flex items-center gap-3">
      <ClinicLogo />
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Klinik Sehat Sentosa</p>
        <p className="mt-1 text-sm font-semibold text-white">Dashboard Demo</p>
      </div>
    </div>
  )
}

function ClinicLogo({ light = false, large = false }: { light?: boolean; large?: boolean }) {
  return (
    <div className={`${large ? "mx-auto h-20 w-20 text-3xl" : "h-12 w-12 text-lg"} flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-sky-500 to-indigo-600 font-black text-white shadow-lg shadow-indigo-600/20 ${light ? "shadow-none" : ""}`}>
      SS
    </div>
  )
}

function StatCard({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return (
    <div className="rounded-3xl border border-slate-700/30 bg-slate-900/55 p-5 shadow-lg backdrop-blur-xl">
      <p className="text-sm font-semibold text-slate-400">{label}</p>
      <p className={`mt-3 text-2xl font-bold ${tone}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </div>
  )
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-700/30 bg-slate-900/55 p-5 shadow-lg backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-bold text-white">{title}</h2>
        {action && <div className="text-xs font-semibold text-indigo-300">{action}</div>}
      </div>
      {children}
    </section>
  )
}

function QueueMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-700/20 bg-slate-950/30 p-3 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function Row({ title, meta, tag }: { title: string; meta: string; tag?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/20 bg-slate-950/30 p-3">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-100">{title}</p>
        <p className="mt-1 truncate text-sm text-slate-400">{meta}</p>
      </div>
      {tag && (
        <span className="shrink-0 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
          {tag}
        </span>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/30 bg-slate-950/30 px-4 py-3">
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  )
}
