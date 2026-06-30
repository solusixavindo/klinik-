/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  TrendingUp,
  UserPlus,
  Clock,
  Stethoscope,
  PackageOpen,
  CalendarCheck,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useProfile } from "@/hooks/useProfile"
import { allDashboardMenuItems } from "@/lib/dashboardMenu"
import { hasPlanFeature, PlanCode } from "@/lib/billing"
import { clearDemoSession } from "@/lib/demoSession"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Selamat pagi"
  if (h < 15) return "Selamat siang"
  if (h < 19) return "Selamat sore"
  return "Selamat malam"
}

type Booking = {
  id: string
  visit_date: string
  price?: number
  payment_status?: string
  patients?: { name?: string; phone?: string }
  doctors?: { name?: string }
}

type Doctor = {
  id: string
  name: string
  specialization?: string
  phone?: string
}

type TopDoctor = {
  name: string
  specialization: string
  bookings: number
  revenue: number
}

type WeeklyVisit = {
  date: string
  label?: string
  count: number
}

type QueueEntry = {
  id: string
  status: string
  patients?: { name?: string }
  doctors?: { name?: string }
}

type TodayStats = {
  total: number
  done: number
  pending: number
  revenue_today: number
}

type QueueNow = {
  waiting: number
  called: number
  serving: number
}

type DashboardResponse = {
  success?: boolean
  error?: string
  stats?: {
    patients: number
    doctors: number
    bookings: number
    revenueToday: number
    totalRevenue: number
  }
  bookings?: Booking[]
  doctors?: Doctor[]
  weekly_visits?: WeeklyVisit[]
  top_doctors?: TopDoctor[]
  revenue_this_month?: number
  revenue_last_month?: number
  new_patients_this_month?: number
  new_patients_last_month?: number
  today_stats?: TodayStats
  today_bookings?: Booking[]
  queue_now?: QueueNow
  queue_entries?: QueueEntry[]
}

type SubscriptionResponse = {
  success?: boolean
  error?: string
  subscription?: {
    plan: {
      code: PlanCode
      name: string
      priceLabel: string
      limits: {
        patients: number
        doctors: number
        staff: number
        bookingsPerMonth: number
      }
    }
    status: string
    days_remaining: number
    is_active: boolean
  }
}

type StockResponse = {
  low_stock_count?: number
}

const DAY_LABELS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
const currencyFormatter = new Intl.NumberFormat("id-ID")

const quickAccess = [
  { href: "/patients", label: "Pendaftaran Rawat Jalan", icon: "▤", tone: "from-blue-950/40" },
  { href: "/doctors", label: "Data Dokter", icon: "▧", tone: "from-teal-950/40" },
  { href: "/schedules", label: "Jadwal Dokter", icon: "▤", tone: "from-cyan-950/40" },
  { href: "/bookings", label: "Booking Sederhana", icon: "▥", tone: "from-purple-950/40" },
  { href: "/pendaftaran/bpjs", label: "Pendaftaran BPJS", icon: "▥", tone: "from-sky-950/40" },
  { href: "/operasional/bridging-bpjs", label: "Bridging BPJS", icon: "▨", tone: "from-emerald-950/40" },
  { href: "/pelayanan/rekam-medis-elektronik", label: "Rekam Medis Elektronik", icon: "▧", tone: "from-emerald-950/40" },
  { href: "/pelayanan/antrian-loket", label: "Antrian Loket", icon: "◇", tone: "from-red-950/40" },
  { href: "/pelayanan/antrian-poli", label: "Antrian Poli", icon: "◌", tone: "from-cyan-950/40" },
  { href: "/pelayanan/antrian-apotek", label: "Antrian Apotek", icon: "▣", tone: "from-pink-950/40" },
  { href: "/pelayanan/laboratorium", label: "Laboratorium", icon: "△", tone: "from-teal-950/40" },
  { href: "/pelayanan/e-resep", label: "E-Resep", icon: "□", tone: "from-rose-950/40" },
  { href: "/invoice", label: "Kasir & Pembayaran", icon: "▩", tone: "from-amber-950/40" },
  { href: "/laporan/pendapatan", label: "Laporan Pendapatan", icon: "▨", tone: "from-indigo-950/40" },
]

const menuItemByHref = new Map(allDashboardMenuItems.map((item) => [item.href, item]))

const demographics = [
  { name: "Anak-anak (0–12)", value: 15, color: "#8b5cf6" },
  { name: "Remaja (13–17)", value: 10, color: "#3b82f6" },
  { name: "Dewasa (18–59)", value: 55, color: "#14b8a6" },
  { name: "Lansia (60+)", value: 20, color: "#f43f5e" },
]

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%"
  const pct = ((current - previous) / previous) * 100
  return (pct >= 0 ? "+" : "") + pct.toFixed(0) + "%"
}

function statusBadge(status: string) {
  if (status === "paid") return <span className="badge badge-success">Lunas</span>
  if (status === "waiting") return <span className="badge badge-warning">Menunggu</span>
  if (status === "called") return <span className="badge badge-info">Dipanggil</span>
  if (status === "serving") return <span className="badge badge-primary">Dilayani</span>
  return <span className="badge">{status}</span>
}

export default function DashboardPage() {
  const { profile, loading } = useProfile()
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    bookings: 0,
    revenueToday: 0,
    totalRevenue: 0,
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [subscription, setSubscription] = useState<SubscriptionResponse["subscription"] | null>(null)
  const [busy, setBusy] = useState(false)

  // Analytics state
  const [weeklyVisits, setWeeklyVisits] = useState<WeeklyVisit[]>([])
  const [topDoctors, setTopDoctors] = useState<TopDoctor[]>([])
  const [revenueThisMonth, setRevenueThisMonth] = useState(0)
  const [revenueLastMonth, setRevenueLastMonth] = useState(0)
  const [newPatientsThisMonth, setNewPatientsThisMonth] = useState(0)
  const [newPatientsLastMonth, setNewPatientsLastMonth] = useState(0)
  const [todayStats, setTodayStats] = useState<TodayStats>({ total: 0, done: 0, pending: 0, revenue_today: 0 })
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])
  const [queueNow, setQueueNow] = useState<QueueNow>({ waiting: 0, called: 0, serving: 0 })
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [recurringDueCount, setRecurringDueCount] = useState(0)

  const fetchDashboard = useCallback(async () => {
    if (!profile?.clinic_id) return

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) return

    const [dashboardRes, subscriptionRes, stockRes, recurringRes] = await Promise.all([
      fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/subscription", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/stock?low_stock=true", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/recurring", { headers: { Authorization: `Bearer ${token}` } }),
    ])

    const dashboard = (await dashboardRes.json()) as DashboardResponse
    const subscriptionData = (await subscriptionRes.json()) as SubscriptionResponse
    const stockData = (await stockRes.json()) as StockResponse
    const recurringData = (await recurringRes.json()) as { due_today?: unknown[] }

    if (dashboardRes.ok && dashboard.success && dashboard.stats) {
      setStats(dashboard.stats)
      setBookings(dashboard.bookings || [])
      setDoctors(dashboard.doctors || [])
      setWeeklyVisits(dashboard.weekly_visits || [])
      setTopDoctors(dashboard.top_doctors || [])
      setRevenueThisMonth(dashboard.revenue_this_month || 0)
      setRevenueLastMonth(dashboard.revenue_last_month || 0)
      setNewPatientsThisMonth(dashboard.new_patients_this_month || 0)
      setNewPatientsLastMonth(dashboard.new_patients_last_month || 0)
      setTodayStats(dashboard.today_stats || { total: 0, done: 0, pending: 0, revenue_today: 0 })
      setTodayBookings(dashboard.today_bookings || [])
      setQueueNow(dashboard.queue_now || { waiting: 0, called: 0, serving: 0 })
      setQueueEntries(dashboard.queue_entries || [])
    }

    if (subscriptionRes.ok && subscriptionData.success && subscriptionData.subscription) {
      setSubscription(subscriptionData.subscription)
    }

    if (stockRes.ok && stockData.low_stock_count !== undefined) {
      setLowStockCount(stockData.low_stock_count)
    }

    if (recurringRes.ok && recurringData.due_today) {
      setRecurringDueCount(recurringData.due_today.length)
    }
  }, [profile?.clinic_id])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Auto-refresh queue every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchDashboard, 30_000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  const inviteStaff = async () => {
    if (!profile?.clinic_id) {
      toast.error("Profil klinik tidak tersedia")
      return
    }

    const email = prompt("Masukkan email staff")
    if (!email) return

    setBusy(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        toast.error("Sesi login tidak valid. Silakan login ulang.")
        setBusy(false)
        return
      }

      const res = await fetch("/api/invite-staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, clinic_id: profile.clinic_id }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Staff berhasil ditambahkan!\nPassword sementara: ${data.password}\nSilakan minta staff mengganti password segera.`)
      } else {
        toast.error(data.error || "Gagal menambahkan staff")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = async () => {
    clearDemoSession()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const avatarUrl = useMemo(() => {
    if (profile?.avatar_url) return profile.avatar_url
    const name = profile?.clinics?.name || "X"
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff`
  }, [profile?.avatar_url, profile?.clinics?.name])

  // Build chart data from weekly_visits
  const chartData = useMemo(() => {
    return weeklyVisits.map((v) => {
      const d = new Date(v.date + "T00:00:00")
      return {
        label: v.label ?? DAY_LABELS_ID[d.getDay()],
        count: v.count,
      }
    })
  }, [weeklyVisits])

  const legacyChartData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      const key = date.toISOString().slice(0, 10)
      const dayBookings = bookings.filter((b) => b.visit_date === key)
      return {
        label: DAY_LABELS_ID[date.getDay()],
        pendaftaran: dayBookings.length,
        pendapatan: dayBookings.reduce((sum, b) => sum + Number(b.price || 0), 0),
      }
    })
  }, [bookings])

  const todaysDoctors = doctors.slice(0, 4)
  const pendingCount = bookings.filter((b) => b.payment_status !== "paid").length
  const avgWaitMinutes = Math.max(12, Math.min(55, 18 + bookings.length * 2))
  const activePlanCode = subscription?.plan.code
  const isNewUser = !loading && stats.patients === 0 && stats.doctors === 0
  const trialDaysLeft = subscription?.status === "trialing" ? subscription.days_remaining : null
  const trialExpiringSoon = trialDaysLeft !== null && trialDaysLeft <= 5

  const nextPlanMap: Record<string, { code: string; name: string; benefit: string }> = {
    basic:    { code: "standard", name: "Standard", benefit: "Buka antrian, rekam medis, dan booking online pasien." },
    standard: { code: "pro",      name: "Profesional", benefit: "Buka kasir, stok obat, e-resep, dan laboratorium." },
    pro:      { code: "premium",  name: "Premium", benefit: "Buka multi cabang, dashboard advanced, dan prioritas support." },
  }
  const nextPlan = activePlanCode ? nextPlanMap[activePlanCode] : null

  const hasQueue    = hasPlanFeature(activePlanCode, "queue_management")
  const hasRevenue  = hasPlanFeature(activePlanCode, "financial_reports")
  const hasStock    = hasPlanFeature(activePlanCode, "inventory_management")
  const hasCashier  = hasPlanFeature(activePlanCode, "cashier_system")

  // Stat cards — only show cards relevant to current plan
  const allStatCards = [
    {
      label: "Kunjungan Hari Ini",
      value: todayStats.total.toLocaleString("id-ID"),
      delta: `${todayStats.done} selesai · ${todayStats.pending} pending`,
      Icon: CalendarCheck,
      href: "/bookings",
      deltaColor: "text-sky-400",
      cardBg: "from-sky-950/40 to-slate-900/30 border-sky-700/20",
      iconBg: "bg-sky-600/15 text-sky-300",
      show: true,
    },
    {
      label: "Total Pasien",
      value: stats.patients.toLocaleString("id-ID"),
      delta: `+${newPatientsThisMonth} pasien bulan ini`,
      Icon: UserPlus,
      href: "/patients",
      deltaColor: "text-blue-400",
      cardBg: "from-blue-950/40 to-slate-900/30 border-blue-700/20",
      iconBg: "bg-blue-600/15 text-blue-300",
      show: true,
    },
    {
      label: "Total Dokter Aktif",
      value: stats.doctors.toLocaleString("id-ID"),
      delta: "dokter terdaftar",
      Icon: Stethoscope,
      href: "/doctors",
      deltaColor: "text-violet-400",
      cardBg: "from-violet-950/40 to-slate-900/30 border-violet-700/20",
      iconBg: "bg-violet-600/15 text-violet-300",
      show: true,
    },
    {
      label: "Antrian Aktif",
      value: (queueNow.waiting + queueNow.called).toLocaleString("id-ID"),
      delta: `${queueNow.serving} sedang dilayani`,
      Icon: Clock,
      href: "/pelayanan/antrian-poli",
      deltaColor: "text-amber-400",
      cardBg: "from-amber-950/40 to-slate-900/30 border-amber-700/20",
      iconBg: "bg-amber-600/15 text-amber-300",
      show: hasQueue,
    },
    {
      label: "Revenue Bulan Ini",
      value: `Rp ${currencyFormatter.format(revenueThisMonth)}`,
      delta: `${pctChange(revenueThisMonth, revenueLastMonth)} vs bulan lalu`,
      Icon: TrendingUp,
      href: "/laporan/pendapatan",
      deltaColor: revenueThisMonth >= revenueLastMonth ? "text-emerald-400" : "text-rose-400",
      cardBg: "from-emerald-950/40 to-slate-900/30 border-emerald-700/20",
      iconBg: "bg-emerald-600/15 text-emerald-300",
      show: hasRevenue,
    },
    {
      label: "Stok Menipis",
      value: lowStockCount.toLocaleString("id-ID"),
      delta: lowStockCount > 0 ? "perlu restock segera" : "semua stok aman",
      Icon: PackageOpen,
      href: "/operasional/stok-obat",
      deltaColor: lowStockCount > 0 ? "text-rose-400" : "text-emerald-400",
      cardBg: lowStockCount > 0 ? "from-rose-950/40 to-slate-900/30 border-rose-700/20" : "from-slate-800/40 to-slate-900/30 border-slate-700/20",
      iconBg: lowStockCount > 0 ? "bg-rose-600/15 text-rose-300" : "bg-slate-600/15 text-slate-300",
      show: hasStock,
    },
  ]
  const statCards = allStatCards.filter((c) => c.show)
  ]

  const canOpenHref = (href: string) => {
    const item = menuItemByHref.get(href)
    if (!item?.requiredFeature) return true
    if (!activePlanCode) return false
    return hasPlanFeature(activePlanCode, item.requiredFeature)
  }

  const visibleQuickAccess = quickAccess.filter((item) => canOpenHref(item.href))

  const notifications = [
    { title: "SLA Poli Umum", meta: "Baru saja", text: `Rata-rata waktu tunggu hari ini ${avgWaitMinutes} menit.` },
    { title: "Stok Obat Menipis", meta: "10 menit lalu", text: lowStockCount > 0 ? `${lowStockCount} item stok menipis, segera restock.` : "Semua stok dalam kondisi aman." },
    { title: "Pembayaran Tertunda", meta: "1 jam lalu", text: `${pendingCount} invoice belum ditandai lunas.` },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-indigo-500"></div>
          </div>
          <p className="text-slate-400">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-700/20 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()}, {profile?.full_name || (profile?.role === "admin" ? "Admin" : "Staff")} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-400">Berikut ringkasan aktivitas klinik hari ini.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-slate-700/20 bg-slate-900/30 px-4 py-3 text-sm font-semibold text-slate-200">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}
          </div>
          {profile?.role === "admin" && (
            <button onClick={inviteStaff} disabled={busy} className="btn-secondary text-sm">
              {busy ? "Memproses..." : "Tambah Staff"}
            </button>
          )}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-700/20 bg-slate-900/30 px-3 py-2">
            <img src={avatarUrl} alt="avatar" className="h-10 w-10 rounded-xl border border-indigo-500/30" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{profile?.clinics?.name || "Klinik"}</p>
              <p className="text-xs text-slate-500">{profile?.role === "admin" ? "Super Admin" : "Staff Klinik"}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost">
            Logout
          </button>
        </div>
      </div>

      {/* Hari Ini Sekilas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Janji Hari Ini", value: todayStats.total, color: "text-sky-400" },
          { label: "Sudah Selesai", value: todayStats.done, color: "text-emerald-400" },
          { label: "Invoice Pending", value: pendingCount, color: "text-amber-400" },
          { label: "Revenue Hari Ini", value: `Rp ${currencyFormatter.format(todayStats.revenue_today ?? 0)}`, color: "text-indigo-400" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-700/20 bg-slate-900/30 px-4 py-3">
            <p className="text-xs text-slate-500 font-medium">{item.label}</p>
            <p className={`mt-1 text-lg font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Onboarding checklist — hanya tampil saat klinik baru (belum ada data) */}
      {isNewUser && (
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 to-slate-900/20 p-6 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Mulai dari sini</p>
          <h2 className="mt-2 text-xl font-bold text-white">Selamat datang! Selesaikan langkah berikut untuk memulai 🎉</h2>
          <p className="mt-1 text-sm text-slate-400">Klinik Anda sudah aktif. Ikuti panduan ini agar sistem siap digunakan.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: 1, label: "Pengaturan Klinik", desc: "Isi nama, alamat, dan nomor WA klinik", href: "/pengaturan", icon: "⚙️" },
              { step: 2, label: "Tambah Dokter", desc: "Daftarkan dokter yang bertugas", href: "/doctors", icon: "🩺" },
              { step: 3, label: "Atur Jadwal", desc: "Tentukan jam praktik tiap dokter", href: "/schedules", icon: "📅" },
              { step: 4, label: "Pasien Pertama", desc: "Daftarkan pasien dan buat booking", href: "/patients", icon: "👤" },
            ].map((item) => (
              <Link key={item.step} href={item.href}>
                <div className="h-full rounded-2xl border border-slate-700/20 bg-slate-900/40 p-4 transition hover:border-indigo-500/40 hover:bg-slate-900/60">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-300">{item.step}</span>
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <p className="font-semibold text-white text-sm">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trial expiry warning */}
      {trialExpiringSoon && (
        <div className={`rounded-3xl border p-5 shadow-lg ${trialDaysLeft! <= 2 ? "border-rose-500/40 bg-gradient-to-br from-rose-950/30 to-slate-900/20" : "border-amber-500/40 bg-gradient-to-br from-amber-950/30 to-slate-900/20"}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${trialDaysLeft! <= 2 ? "text-rose-400" : "text-amber-400"}`}>
                {trialDaysLeft! <= 2 ? "⚠️ Trial hampir berakhir!" : "🔔 Pengingat trial"}
              </p>
              <p className="mt-1 font-bold text-white">
                Trial Anda berakhir dalam <span className={trialDaysLeft! <= 2 ? "text-rose-300" : "text-amber-300"}>{trialDaysLeft} hari</span>
              </p>
              <p className="mt-1 text-sm text-slate-400">Aktifkan paket sekarang agar operasional klinik tidak terganggu.</p>
            </div>
            <Link href="/billing" className="btn-primary shrink-0 text-center">
              Aktifkan Paket →
            </Link>
          </div>
        </div>
      )}

      {/* Upgrade Banner — plan-aware */}
      {nextPlan && !trialExpiringSoon && (
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 to-slate-900/20 p-5 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Upgrade ke {nextPlan.name}</p>
              <p className="mt-1 font-bold text-white">{nextPlan.benefit}</p>
            </div>
            <Link href="/billing" className="btn-secondary shrink-0 text-center text-sm">
              Lihat Paket {nextPlan.name} →
            </Link>
          </div>
        </div>
      )}

      {/* Recurring Due Banner */}
      {recurringDueCount > 0 && (
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-slate-900/20 p-4 shadow-md flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-amber-300">
            ⚠️ {recurringDueCount} tagihan berulang jatuh tempo hari ini
          </p>
          <Link href="/operasional/tagihan-recurring" className="btn-primary text-sm shrink-0 text-center">
            Generate Sekarang
          </Link>
        </div>
      )}

      {/* Section 1 — 6 Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className={`group h-full rounded-3xl border bg-gradient-to-br ${card.cardBg} p-5 shadow-md transition hover:shadow-lg hover:brightness-110`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-400">{card.label}</p>
                  <h3 className="mt-3 text-2xl font-bold text-white truncate">{card.value}</h3>
                  <p className={`mt-2 text-xs font-semibold ${card.deltaColor}`}>
                    {card.delta}{card.deltaLabel ? ` ${card.deltaLabel}` : ""}
                  </p>
                </div>
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${card.iconBg}`}>
                  <card.Icon size={22} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Subscription Panel */}
      {subscription && (
        <div className={`rounded-3xl border p-5 shadow-md ${
          subscription.is_active
            ? "border-emerald-600/30 bg-gradient-to-br from-emerald-950/30 to-slate-900/30"
            : "border-amber-600/30 bg-gradient-to-br from-amber-950/30 to-slate-900/30"
        }`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-300">Paket Klinik</p>
              <h3 className="mt-1 text-xl font-bold text-white">{subscription.plan.name} · {subscription.plan.priceLabel}</h3>
              <p className="mt-1 text-sm text-slate-300">
                {subscription.status === "trialing"
                  ? `Trial aktif, tersisa ${subscription.days_remaining} hari.`
                  : subscription.is_active
                    ? "Langganan aktif dan fitur utama tersedia."
                    : "Langganan perlu diperbarui untuk menjaga akses penuh."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <PlanLimit label="Pasien" value={subscription.plan.limits.patients} />
              <PlanLimit label="Dokter" value={subscription.plan.limits.doctors} />
              <PlanLimit label="Staff" value={subscription.plan.limits.staff} />
              <PlanLimit label="Booking/bln" value={subscription.plan.limits.bookingsPerMonth} />
            </div>
          </div>
        </div>
      )}

      {/* Section 2 — Grafik Kunjungan 7 Hari (AreaChart) */}
      <DashboardPanel title="Grafik Kunjungan" action="7 Hari Terakhir">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.length ? chartData : legacyChartData.map((d) => ({ label: d.label, count: d.pendaftaran }))}>
              <defs>
                <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(v) => [`${Number(v)} kunjungan`, "Kunjungan"]}
                contentStyle={{ background: "#111827", border: "1px solid rgba(148,163,184,.25)", borderRadius: 16 }}
              />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fill="url(#visitGradient)" dot={{ r: 4, fill: "#6366f1" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashboardPanel>

      {/* Section 3 — Grid bawah: Top Dokter & Antrian Hari Ini */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Top Dokter Bulan Ini */}
        <DashboardPanel title="Top Dokter Bulan Ini" action="5 Terbaik">
          {topDoctors.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada data booking bulan ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/30">
                    <th className="pb-3 text-left text-xs font-semibold text-slate-500">Dokter</th>
                    <th className="pb-3 text-left text-xs font-semibold text-slate-500">Spesialisasi</th>
                    <th className="pb-3 text-right text-xs font-semibold text-slate-500">Kunjungan</th>
                    <th className="pb-3 text-right text-xs font-semibold text-slate-500">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/20">
                  {topDoctors.map((doc, i) => (
                    <tr key={doc.name + i} className="group">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-300">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-white truncate max-w-[120px]">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-400 truncate max-w-[100px]">{doc.specialization}</td>
                      <td className="py-3 text-right font-bold text-white">{doc.bookings}</td>
                      <td className="py-3 text-right text-emerald-400 text-xs font-semibold">
                        Rp {currencyFormatter.format(doc.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardPanel>

        {/* Antrian Hari Ini — Timeline */}
        <DashboardPanel title="Antrian Hari Ini" action="Live">
          <div className="mb-4 flex gap-3">
            <div className="flex-1 rounded-2xl border border-amber-600/20 bg-amber-950/20 p-3 text-center">
              <p className="text-xs text-amber-400 font-semibold">Menunggu</p>
              <p className="mt-1 text-2xl font-bold text-white">{queueNow.waiting}</p>
            </div>
            <div className="flex-1 rounded-2xl border border-sky-600/20 bg-sky-950/20 p-3 text-center">
              <p className="text-xs text-sky-400 font-semibold">Dipanggil</p>
              <p className="mt-1 text-2xl font-bold text-white">{queueNow.called}</p>
            </div>
            <div className="flex-1 rounded-2xl border border-emerald-600/20 bg-emerald-950/20 p-3 text-center">
              <p className="text-xs text-emerald-400 font-semibold">Dilayani</p>
              <p className="mt-1 text-2xl font-bold text-white">{queueNow.serving}</p>
            </div>
          </div>
          {queueEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <span className="text-2xl opacity-30">◎</span>
              <p className="text-sm text-slate-400">Tidak ada antrian aktif saat ini.</p>
            </div>
          ) : (
            <div className="relative max-h-52 overflow-y-auto pl-5">
              <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-700/40" />
              <div className="space-y-4">
                {queueEntries.map((entry) => {
                  const dotColor =
                    entry.status === "serving" ? "bg-emerald-400 shadow-emerald-400/50" :
                    entry.status === "called" ? "bg-sky-400 shadow-sky-400/50" :
                    entry.status === "paid" ? "bg-indigo-400 shadow-indigo-400/50" :
                    "bg-amber-400 shadow-amber-400/50"
                  return (
                    <div key={entry.id} className="relative flex items-start gap-4 pl-4">
                      <span className={`absolute -left-[3px] mt-1.5 h-2.5 w-2.5 rounded-full shadow-md ${dotColor}`} />
                      <div className="flex w-full items-center justify-between rounded-2xl border border-slate-700/20 bg-slate-900/20 px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{entry.patients?.name || "—"}</p>
                          <p className="text-xs text-slate-500">{entry.doctors?.name || "Umum"}</p>
                        </div>
                        <div>{statusBadge(entry.status)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </DashboardPanel>
      </div>

      {/* Section 4 — Aktivitas Terbaru (5 booking hari ini) */}
      <DashboardPanel title="Aktivitas Terbaru Hari Ini" action="5 Terakhir">
        {todayBookings.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada booking hari ini.</p>
        ) : (
          <div className="space-y-2">
            {todayBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-2xl border border-slate-700/20 bg-slate-900/20 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600/15 text-sm text-indigo-300">
                    ◌
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{b.patients?.name || "Pasien"}</p>
                    <p className="text-xs text-slate-500 truncate">{b.doctors?.name || "Dokter"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400">{b.visit_date}</span>
                  {statusBadge(b.payment_status || "pending")}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      {/* Grafik lama — Pendapatan & Demografi */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <DashboardPanel title="Grafik Pendaftaran (7 Hari)" action="Detail">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={legacyChartData}>
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(148,163,184,.25)", borderRadius: 16 }} />
                  <Line type="monotone" dataKey="pendaftaran" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <SmallMetric label="Rata-rata Waktu Tunggu" value={`${avgWaitMinutes} mnt`} note="Estimasi hari ini" icon="◷" />
            <SmallMetric label="Booking Belum Bayar" value={pendingCount.toLocaleString("id-ID")} note="Perlu konfirmasi" icon="▣" />
            <SmallMetric label="Pasien Baru Bulan Ini" value={newPatientsThisMonth.toLocaleString("id-ID")} note={`${pctChange(newPatientsThisMonth, newPatientsLastMonth)} vs bulan lalu`} icon="◇" />
            <SmallMetric label="Pendapatan Bulan Ini" value={`Rp ${(revenueThisMonth / 1000).toFixed(0)}rb`} note={`${pctChange(revenueThisMonth, revenueLastMonth)} vs bulan lalu`} icon="☆" />
          </div>
        </div>

        <div className="space-y-6">
          <DashboardPanel title="Demografi Pasien" action="Estimasi">
            {stats.patients === 0 ? (
              <div className="flex h-44 flex-col items-center justify-center gap-2 text-center">
                <span className="text-3xl opacity-20">◎</span>
                <p className="text-sm font-medium text-slate-400">Belum ada data pasien</p>
                <p className="text-xs text-slate-500">Grafik akan muncul setelah pasien pertama terdaftar.</p>
                <Link href="/patients" className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300">Daftarkan pasien →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[180px_1fr]">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={demographics} innerRadius={46} outerRadius={78} paddingAngle={2} dataKey="value">
                        {demographics.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {demographics.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                      </div>
                      <span className="font-semibold text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Pendapatan 7 Hari Terakhir">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={legacyChartData}>
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000} rb`} />
                  <Tooltip formatter={(value) => `Rp ${currencyFormatter.format(Number(value))}`} contentStyle={{ background: "#111827", border: "1px solid rgba(148,163,184,.25)", borderRadius: 16 }} />
                  <Area type="monotone" dataKey="pendapatan" stroke="#22c55e" fill="#22c55e" fillOpacity={0.16} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>
        </div>
      </div>

      {/* Akses Cepat & Sidebar */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-5 shadow-md">
          <h3 className="mb-4 text-lg font-bold text-white">Akses Cepat</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {visibleQuickAccess.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className={`h-full rounded-2xl border border-slate-700/20 bg-gradient-to-br ${item.tone} to-slate-900/30 p-4 text-center transition hover:border-indigo-500/30`}>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/30 text-xl text-indigo-300">
                    {item.icon}
                  </div>
                  <p className="text-xs font-semibold leading-snug text-white">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <DashboardPanel title="Jadwal Dokter Hari Ini" action="Lihat Semua">
            <div className="space-y-3">
              {todaysDoctors.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada dokter terdaftar.</p>
              ) : todaysDoctors.map((doctor, index) => (
                <div key={doctor.id} className="flex items-center gap-3 rounded-2xl border border-slate-700/20 bg-slate-900/20 p-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=4f46e5&color=fff`}
                    alt={doctor.name}
                    className="h-11 w-11 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{doctor.name}</p>
                    <p className="truncate text-xs text-slate-500">{doctor.specialization || "Dokter Umum"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{index % 2 === 0 ? "08:00 - 14:00" : "09:00 - 15:00"}</p>
                    <span className="badge badge-success mt-1">Tersedia</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Notifikasi / Informasi" action="Lihat Semua">
            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-700/20 bg-slate-900/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <span className="text-xs text-slate-500">{item.meta}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </div>
  )
}

function DashboardPanel({
  title,
  action,
  children,
}: {
  title: string
  action?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-bold text-white">{title}</h3>
        {action && <span className="text-xs font-semibold text-indigo-400">{action}</span>}
      </div>
      {children}
    </div>
  )
}

function SmallMetric({
  label,
  value,
  note,
  icon,
}: {
  label: string
  value: string
  note: string
  icon: string
}) {
  return (
    <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-5 text-center shadow-md">
      <p className="text-xs text-slate-400">{label}</p>
      <h3 className="mt-4 text-2xl font-bold text-white">{value}</h3>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
      <div className="mx-auto mt-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600/15 text-xl text-indigo-300">
        {icon}
      </div>
    </div>
  )
}

function PlanLimit({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-700/20 bg-slate-900/30 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-white">{value.toLocaleString("id-ID")}</p>
    </div>
  )
}
