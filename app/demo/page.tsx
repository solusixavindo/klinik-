"use client"

import Link from "next/link"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { PLANS, type PlanCode } from "@/lib/billing"
import {
  demoDoctors,
  demoInvoices,
  demoPatients,
  demoSchedules,
  demoStockItems,
  getDemoBookings,
  getDemoDashboard,
} from "@/lib/demoData"

const demoPlans: PlanCode[] = ["basic", "standard", "pro", "premium"]
const formatRp = (value: number) => `Rp ${value.toLocaleString("id-ID")}`

export default function DemoPage() {
  const [plan, setPlan] = useState<PlanCode>("standard")
  const data = useMemo(() => getDemoDashboard(plan), [plan])
  const bookings = useMemo(() => getDemoBookings(), [])
  const selectedPlan = PLANS[plan]

  const handleDemoAction = () => {
    alert("Mode demo: data tidak disimpan. Daftar Free Trial untuk memakai data klinik real.")
  }

  useEffect(() => {
    const planFromUrl = new URLSearchParams(window.location.search).get("plan") as PlanCode | null
    if (planFromUrl && demoPlans.includes(planFromUrl)) {
      setPlan(planFromUrl)
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-6 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-700/30 bg-slate-900/50 p-5 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/20">
              X
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white">XaviKlinika Demo</h1>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-200">
                  Demo Mode
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">Data simulasi lokal untuk preview fitur. Tidak terhubung ke Supabase production.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary">
              Mulai Free Trial 14 Hari
            </Link>
            <Link href="/login" className="btn-secondary">
              Masuk Akun Real
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-slate-700/30 bg-slate-900/45 p-5 backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Paket Demo</p>
            <div className="mt-4 grid gap-3">
              {demoPlans.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPlan(item)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    plan === item
                      ? "border-indigo-400/60 bg-indigo-600/20 text-white"
                      : "border-slate-700/30 bg-slate-950/30 text-slate-300 hover:border-indigo-500/40"
                  }`}
                >
                  <span className="block text-xs font-bold uppercase tracking-widest text-indigo-300">{PLANS[item].name}</span>
                  <span className="mt-1 block text-sm text-slate-400">{PLANS[item].priceLabel}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-700/30 bg-slate-950/30 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Fitur aktif</p>
              <div className="mt-3 space-y-2">
                {selectedPlan.features.slice(0, 7).map((feature) => (
                  <p key={feature} className="text-sm text-slate-300">
                    <span className="text-emerald-400">✓</span> {feature}
                  </p>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total Pasien", value: data.stats.patients.toLocaleString("id-ID"), hint: `${data.new_patients_this_month} pasien baru`, tone: "text-emerald-300" },
                { label: "Total Booking", value: data.stats.bookings.toLocaleString("id-ID"), hint: `${data.today_stats.total} hari ini`, tone: "text-sky-300" },
                { label: "Revenue Bulan Ini", value: formatRp(data.revenue_this_month), hint: "data simulasi", tone: "text-indigo-300" },
                { label: "Stok Menipis", value: String(data.low_stock_count), hint: "perlu restock", tone: "text-amber-300" },
              ].map((card) => (
                <div key={card.label} className="rounded-3xl border border-slate-700/30 bg-slate-900/45 p-5 backdrop-blur-xl">
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className={`mt-3 text-3xl font-bold ${card.tone}`}>{card.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{card.hint}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-3xl border border-slate-700/30 bg-slate-900/45 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Grafik Kunjungan</p>
                    <h2 className="mt-1 text-xl font-bold text-white">7 hari terakhir</h2>
                  </div>
                  <button type="button" onClick={handleDemoAction} className="btn-secondary px-4 py-2 text-xs">
                    Export
                  </button>
                </div>
                <div className="mt-6 flex h-56 items-end gap-3">
                  {data.weekly_visits.map((item) => {
                    const height = Math.max(18, item.count * 5)
                    return (
                      <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-44 w-full items-end rounded-2xl bg-slate-950/40 p-1">
                          <div
                            className="w-full rounded-xl bg-gradient-to-t from-indigo-600 to-sky-400"
                            style={{ height }}
                            title={`${item.count} kunjungan`}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{item.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700/30 bg-slate-900/45 p-5 backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Antrian Aktif</p>
                <h2 className="mt-1 text-xl font-bold text-white">{data.queue_now.waiting + data.queue_now.called} pasien</h2>
                <div className="mt-5 space-y-3">
                  {data.queue_entries.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-slate-700/30 bg-slate-950/30 p-4">
                      <p className="font-semibold text-white">{entry.patients?.name}</p>
                      <p className="text-sm text-slate-400">{entry.doctors?.name}</p>
                      <span className="mt-3 inline-flex rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200">
                        {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <DemoList title="Pasien Dummy" action={handleDemoAction}>
                {demoPatients.map((patient) => (
                  <Row key={patient.id} title={patient.name} meta={`${patient.phone} · ${patient.gender}`} />
                ))}
              </DemoList>

              <DemoList title="Dokter Dummy" action={handleDemoAction}>
                {demoDoctors.map((doctor) => (
                  <Row key={doctor.id} title={doctor.name} meta={`${doctor.specialization} · ${doctor.experience}`} />
                ))}
              </DemoList>

              <DemoList title="Jadwal Dummy" action={handleDemoAction}>
                {demoSchedules.map((schedule) => (
                  <Row key={schedule.id} title={`${schedule.day}, ${schedule.start_time}`} meta={`${schedule.end_time} · ${schedule.doctors.name}`} />
                ))}
              </DemoList>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <DemoList title="Booking Dummy" action={handleDemoAction}>
                {bookings.map((booking) => (
                  <Row key={booking.id} title={booking.patients.name} meta={`${booking.doctors.name} · ${formatRp(booking.price)}`} />
                ))}
              </DemoList>

              <DemoList title="Stok Obat Dummy" action={handleDemoAction}>
                {demoStockItems.map((item) => (
                  <Row key={item.id} title={item.name} meta={`${item.stock} ${item.unit} · min ${item.min_stock}`} />
                ))}
              </DemoList>

              <DemoList title="Invoice Dummy" action={handleDemoAction}>
                {demoInvoices.map((invoice) => (
                  <Row key={invoice.id} title={invoice.id} meta={`${invoice.patient_name} · ${formatRp(invoice.amount)}`} />
                ))}
              </DemoList>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

function DemoList({ title, children, action }: { title: string; children: React.ReactNode; action: () => void }) {
  return (
    <div className="rounded-3xl border border-slate-700/30 bg-slate-900/45 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-white">{title}</h2>
        <button type="button" onClick={action} className="rounded-xl border border-slate-700/40 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800">
          Tambah
        </button>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  )
}

function Row({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/30 bg-slate-950/30 p-3">
      <p className="font-semibold text-slate-100">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{meta}</p>
    </div>
  )
}
