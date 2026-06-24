import { PLANS, type PlanCode } from "@/lib/billing"
import type { DemoSession } from "@/lib/demoSession"

export const isDemoClinicId = (clinicId?: string | null) =>
  typeof clinicId === "string" && clinicId.startsWith("demo-")

export const getDemoClinicSettings = (session: DemoSession) => {
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setDate(periodEnd.getDate() + 30)

  return {
    id: `demo-${session.plan}`,
    name: session.clinicName,
    address: "Jl. Klinik Demo No. 1, Jakarta",
    phone: "021-555-0000",
    email: session.email,
    slug: `demo-${session.plan}`,
    online_booking_enabled: true,
    plan: session.plan,
    subscription_status: "active",
    trial_ends_at: null,
    current_period_end: periodEnd.toISOString(),
  }
}

export const getDemoSubscription = (planCode: PlanCode) => {
  const plan = PLANS[planCode]

  return {
    plan: {
      code: plan.code,
      name: plan.name,
      priceLabel: plan.priceLabel,
      limits: plan.limits,
    },
    status: "active",
    days_remaining: 30,
    is_active: true,
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export const demoPatients = [
  {
    id: "demo-patient-1",
    name: "Ahmad Santoso",
    phone: "081234567001",
    gender: "Laki-laki",
    birth_date: "1988-02-12",
    address: "Jakarta",
    clinic_id: "demo",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-patient-2",
    name: "Siti Rahma",
    phone: "081234567002",
    gender: "Perempuan",
    birth_date: "1992-08-23",
    address: "Bekasi",
    clinic_id: "demo",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-patient-3",
    name: "Budi Hartono",
    phone: "081234567003",
    gender: "Laki-laki",
    birth_date: "1979-11-05",
    address: "Depok",
    clinic_id: "demo",
    created_at: new Date().toISOString(),
  },
]

export const demoDoctors = [
  {
    id: "demo-doctor-1",
    name: "dr. Maya Putri",
    specialization: "Dokter Umum",
    phone: "081234560001",
    email: "maya.demo@xaviklinika.local",
    experience: "8 tahun",
    clinic_id: "demo",
  },
  {
    id: "demo-doctor-2",
    name: "drg. Raka Aditya",
    specialization: "Dokter Gigi",
    phone: "081234560002",
    email: "raka.demo@xaviklinika.local",
    experience: "6 tahun",
    clinic_id: "demo",
  },
  {
    id: "demo-doctor-3",
    name: "dr. Lina Kartika",
    specialization: "Spesialis Anak",
    phone: "081234560003",
    email: "lina.demo@xaviklinika.local",
    experience: "10 tahun",
    clinic_id: "demo",
  },
]

export const getDemoBookings = () => {
  const today = new Date().toISOString().slice(0, 10)

  return [
    {
      id: "demo-booking-1",
      patient_id: "demo-patient-1",
      doctor_id: "demo-doctor-1",
      clinic_id: "demo",
      visit_date: today,
      price: 150000,
      payment_status: "paid",
      patients: demoPatients[0],
      doctors: demoDoctors[0],
    },
    {
      id: "demo-booking-2",
      patient_id: "demo-patient-2",
      doctor_id: "demo-doctor-2",
      clinic_id: "demo",
      visit_date: today,
      price: 225000,
      payment_status: "pending",
      patients: demoPatients[1],
      doctors: demoDoctors[1],
    },
    {
      id: "demo-booking-3",
      patient_id: "demo-patient-3",
      doctor_id: "demo-doctor-3",
      clinic_id: "demo",
      visit_date: today,
      price: 175000,
      payment_status: "waiting",
      patients: demoPatients[2],
      doctors: demoDoctors[2],
    },
  ]
}

export const demoSchedules = [
  {
    id: "demo-schedule-1",
    day: "Senin",
    start_time: "08:00",
    end_time: "14:00",
    doctors: demoDoctors[0],
  },
  {
    id: "demo-schedule-2",
    day: "Rabu",
    start_time: "09:00",
    end_time: "15:00",
    doctors: demoDoctors[1],
  },
  {
    id: "demo-schedule-3",
    day: "Jumat",
    start_time: "10:00",
    end_time: "16:00",
    doctors: demoDoctors[2],
  },
]

export const demoStockItems = [
  { id: "demo-stock-1", name: "Paracetamol 500mg", category: "Obat Umum", stock: 124, min_stock: 40, unit: "tablet", sell_price: 3500 },
  { id: "demo-stock-2", name: "Amoxicillin 500mg", category: "Antibiotik", stock: 28, min_stock: 30, unit: "kapsul", sell_price: 8500 },
  { id: "demo-stock-3", name: "Masker Medis", category: "Alkes", stock: 240, min_stock: 80, unit: "pcs", sell_price: 1500 },
  { id: "demo-stock-4", name: "Alkohol Swab", category: "Alkes", stock: 18, min_stock: 50, unit: "box", sell_price: 25000 },
]

export const demoInvoices = [
  { id: "INV-DEMO-001", patient_name: "Ahmad Santoso", amount: 150000, status: "paid", date: new Date().toISOString().slice(0, 10) },
  { id: "INV-DEMO-002", patient_name: "Siti Rahma", amount: 225000, status: "pending", date: new Date().toISOString().slice(0, 10) },
  { id: "INV-DEMO-003", patient_name: "Budi Hartono", amount: 175000, status: "partial", date: new Date().toISOString().slice(0, 10) },
]

export const demoRevenueTrend = [
  { label: "Sen", revenue: 9800000, visits: 26 },
  { label: "Sel", revenue: 11200000, visits: 31 },
  { label: "Rab", revenue: 10400000, visits: 28 },
  { label: "Kam", revenue: 13500000, visits: 37 },
  { label: "Jum", revenue: 12800000, visits: 34 },
  { label: "Sab", revenue: 15300000, visits: 42 },
  { label: "Min", revenue: 9600000, visits: 25 },
]

export const demoBookingStatus = [
  { label: "Selesai", value: 58, color: "bg-emerald-400" },
  { label: "Menunggu", value: 24, color: "bg-amber-400" },
  { label: "Berjalan", value: 12, color: "bg-sky-400" },
  { label: "Batal", value: 6, color: "bg-rose-400" },
]

export const demoStaffActivities = [
  { id: "act-1", name: "Nadia", action: "menutup invoice INV-2026-184", time: "2 menit lalu" },
  { id: "act-2", name: "Raka", action: "menjadwalkan booking kontrol", time: "8 menit lalu" },
  { id: "act-3", name: "Maya", action: "menambahkan catatan rekam medis", time: "14 menit lalu" },
  { id: "act-4", name: "Sinta", action: "mengirim reminder WhatsApp", time: "22 menit lalu" },
]

export const getDemoDashboard = (planCode: PlanCode) => {
  const bookings = getDemoBookings()
  const weekly_visits = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((label, index) => ({
    date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    label,
    count: [18, 22, 19, 27, 31, 16, 12][index],
  }))

  return {
    stats: {
      patients: 1248,
      doctors: 12,
      bookings: 32,
      revenueToday: 12600000,
      totalRevenue: 86500000,
    },
    bookings,
    doctors: demoDoctors,
    weekly_visits,
    top_doctors: [
      { name: "dr. Maya Putri", specialization: "Dokter Umum", bookings: 46, revenue: 6900000 },
      { name: "drg. Raka Aditya", specialization: "Dokter Gigi", bookings: 31, revenue: 6975000 },
      { name: "dr. Lina Kartika", specialization: "Spesialis Anak", bookings: 28, revenue: 4900000 },
    ],
    revenue_this_month: 86500000,
    revenue_last_month: 74200000,
    new_patients_this_month: 214,
    new_patients_last_month: 188,
    today_stats: { total: 32, done: 24, pending: 8, revenue_today: 12600000 },
    today_bookings: bookings,
    queue_now: { waiting: 5, called: 2, serving: 1 },
    queue_entries: [
      { id: "demo-queue-1", status: "waiting", patients: { name: "Ahmad Santoso" }, doctors: { name: "dr. Maya Putri" } },
      { id: "demo-queue-2", status: "called", patients: { name: "Siti Rahma" }, doctors: { name: "drg. Raka Aditya" } },
      { id: "demo-queue-3", status: "serving", patients: { name: "Budi Hartono" }, doctors: { name: "dr. Lina Kartika" } },
    ],
    stock_items: demoStockItems,
    invoices: demoInvoices,
    revenue_trend: demoRevenueTrend,
    booking_status: demoBookingStatus,
    staff_activities: demoStaffActivities,
    low_stock_count: 8,
    paid_invoice_count: 184,
    recurring_due_count: planCode === "basic" ? 0 : 2,
  }
}
