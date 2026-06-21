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

export const getDemoDashboard = (planCode: PlanCode) => {
  const bookings = getDemoBookings()
  const weekly_visits = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((label, index) => ({
    date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    label,
    count: [18, 22, 19, 27, 31, 16, 12][index],
  }))

  return {
    stats: {
      patients: planCode === "basic" ? 128 : planCode === "standard" ? 426 : planCode === "pro" ? 1240 : 3280,
      doctors: planCode === "basic" ? 3 : planCode === "standard" ? 8 : planCode === "pro" ? 18 : 42,
      bookings: planCode === "basic" ? 36 : planCode === "standard" ? 118 : planCode === "pro" ? 320 : 860,
      revenueToday: 550000,
      totalRevenue: planCode === "basic" ? 7850000 : planCode === "standard" ? 24650000 : planCode === "pro" ? 68200000 : 182400000,
    },
    bookings,
    doctors: demoDoctors,
    weekly_visits,
    top_doctors: [
      { name: "dr. Maya Putri", specialization: "Dokter Umum", bookings: 46, revenue: 6900000 },
      { name: "drg. Raka Aditya", specialization: "Dokter Gigi", bookings: 31, revenue: 6975000 },
      { name: "dr. Lina Kartika", specialization: "Spesialis Anak", bookings: 28, revenue: 4900000 },
    ],
    revenue_this_month: planCode === "basic" ? 7850000 : planCode === "standard" ? 24650000 : planCode === "pro" ? 68200000 : 182400000,
    revenue_last_month: planCode === "basic" ? 6200000 : planCode === "standard" ? 21400000 : planCode === "pro" ? 64100000 : 171000000,
    new_patients_this_month: planCode === "basic" ? 24 : planCode === "standard" ? 78 : planCode === "pro" ? 188 : 420,
    new_patients_last_month: planCode === "basic" ? 18 : planCode === "standard" ? 64 : planCode === "pro" ? 171 : 388,
    today_stats: { total: 24, done: 16, pending: 8, revenue_today: 550000 },
    today_bookings: bookings,
    queue_now: { waiting: 5, called: 2, serving: 1 },
    queue_entries: [
      { id: "demo-queue-1", status: "waiting", patients: { name: "Ahmad Santoso" }, doctors: { name: "dr. Maya Putri" } },
      { id: "demo-queue-2", status: "called", patients: { name: "Siti Rahma" }, doctors: { name: "drg. Raka Aditya" } },
      { id: "demo-queue-3", status: "serving", patients: { name: "Budi Hartono" }, doctors: { name: "dr. Lina Kartika" } },
    ],
    low_stock_count: planCode === "basic" || planCode === "standard" ? 0 : 3,
    recurring_due_count: planCode === "basic" ? 0 : 2,
  }
}
