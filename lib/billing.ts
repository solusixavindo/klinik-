export type PlanCode = "trial" | "basic" | "standard" | "pro" | "premium"
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled"

export type Plan = {
  code: PlanCode
  name: string
  priceLabel: string
  setupPriceLabel: string
  monthlyPrice: number
  description: string
  features: string[]
  limits: {
    patients: number
    doctors: number
    staff: number
    bookingsPerMonth: number
  }
}

export const PLANS: Record<PlanCode, Plan> = {
  trial: {
    code: "trial",
    name: "Trial",
    priceLabel: "Gratis 14 hari",
    setupPriceLabel: "Tanpa biaya setup",
    monthlyPrice: 0,
    description: "Untuk mencoba sistem dan demo internal klinik.",
    features: [
      "Dashboard operasional",
      "Data pasien dan dokter dasar",
      "Booking dan invoice dasar",
    ],
    limits: {
      patients: 50,
      doctors: 5,
      staff: 2,
      bookingsPerMonth: 100,
    },
  },
  basic: {
    code: "basic",
    name: "Basic",
    priceLabel: "Rp 249.000/bulan",
    setupPriceLabel: "Setup: Rp 750.000",
    monthlyPrice: 249000,
    description: "Untuk klinik baru yang mulai digitalisasi administrasi dasar.",
    features: [
      "Data pasien",
      "Data dokter & jadwal",
      "Booking via WA + input oleh staf",
      "Dashboard ringkas",
      "Maksimal 2 user",
    ],
    limits: {
      patients: 1000,
      doctors: 5,
      staff: 2,
      bookingsPerMonth: 1000,
    },
  },
  standard: {
    code: "standard",
    name: "Standard",
    priceLabel: "Rp 499.000/bulan",
    setupPriceLabel: "Setup: Rp 1.500.000",
    monthlyPrice: 499000,
    description: "Untuk klinik yang ingin operasional lebih rapi dan terstruktur.",
    features: [
      "Semua fitur Basic",
      "Antrian (Poli / Loket / Apotek)",
      "Rekam medis digital",
      "Booking online (pasien self-serve)",
      "BPJS pendaftaran",
      "Multi staff",
      "Laporan operasional",
    ],
    limits: {
      patients: 5000,
      doctors: 20,
      staff: 10,
      bookingsPerMonth: 5000,
    },
  },
  pro: {
    code: "pro",
    name: "Profesional",
    priceLabel: "Rp 899.000/bulan",
    setupPriceLabel: "Setup: Rp 3.000.000",
    monthlyPrice: 899000,
    description: "Solusi lengkap untuk kontrol bisnis klinik profesional.",
    features: [
      "Semua fitur Standard",
      "BPJS bridging",
      "Kasir & invoice otomatis",
      "Laporan keuangan",
      "Stok obat",
      "E-Resep & Laboratorium",
      "Role & akses staff",
    ],
    limits: {
      patients: 20000,
      doctors: 50,
      staff: 50,
      bookingsPerMonth: 20000,
    },
  },
  premium: {
    code: "premium",
    name: "Premium",
    priceLabel: "Mulai Rp 1.500.000/bulan",
    setupPriceLabel: "Setup: Mulai Rp 5.000.000",
    monthlyPrice: 1500000,
    description: "Untuk klinik yang ingin scale ke multi-cabang dan profesionalisasi.",
    features: [
      "Semua fitur Profesional",
      "Multi cabang",
      "Dashboard advanced",
      "BPJS bridging multi cabang",
      "Laporan performa & SLA",
      "Custom workflow",
      "Prioritas support",
    ],
    limits: {
      patients: 99999,
      doctors: 999,
      staff: 999,
      bookingsPerMonth: 99999,
    },
  },
}

export const DEFAULT_PLAN: PlanCode = "trial"
export const TRIAL_DAYS = 14

export const getPlan = (plan?: string | null) =>
  PLANS[(plan as PlanCode) || DEFAULT_PLAN] || PLANS[DEFAULT_PLAN]

export const isPlanCode = (plan: string): plan is PlanCode =>
  Object.prototype.hasOwnProperty.call(PLANS, plan)

export const getTrialEndDate = (start = new Date()) => {
  const date = new Date(start)
  date.setDate(date.getDate() + TRIAL_DAYS)
  return date.toISOString()
}

export const getDaysRemaining = (date?: string | null) => {
  if (!date) return 0
  const end = new Date(date).getTime()
  const now = Date.now()
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
}

export const getNextBillingDate = (start = new Date()) => {
  const date = new Date(start)
  date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}

// Feature gating system
export type PlanFeature =
  | "patient_management"
  | "doctor_schedule"
  | "booking_system"
  | "queue_management"
  | "medical_records"
  | "online_booking"
  | "bpjs_registration"
  | "bpjs_bridging"
  | "multi_staff"
  | "operational_reports"
  | "cashier_system"
  | "financial_reports"
  | "inventory_management"
  | "auto_invoice"
  | "role_based_access"
  | "multi_branch"
  | "advanced_dashboard"
  | "performance_reports"
  | "custom_workflow"
  | "priority_support"

export const PLAN_FEATURES: Record<PlanCode, PlanFeature[]> = {
  trial: [
    "patient_management",
    "doctor_schedule",
    "booking_system",
  ],
  basic: [
    "patient_management",
    "doctor_schedule",
    "booking_system",
  ],
  standard: [
    "patient_management",
    "doctor_schedule",
    "booking_system",
    "queue_management",
    "medical_records",
    "online_booking",
    "bpjs_registration",
    "multi_staff",
    "operational_reports",
  ],
  pro: [
    "patient_management",
    "doctor_schedule",
    "booking_system",
    "queue_management",
    "medical_records",
    "online_booking",
    "bpjs_registration",
    "bpjs_bridging",
    "multi_staff",
    "operational_reports",
    "cashier_system",
    "financial_reports",
    "inventory_management",
    "auto_invoice",
    "role_based_access",
  ],
  premium: [
    "patient_management",
    "doctor_schedule",
    "booking_system",
    "queue_management",
    "medical_records",
    "online_booking",
    "bpjs_registration",
    "bpjs_bridging",
    "multi_staff",
    "operational_reports",
    "cashier_system",
    "financial_reports",
    "inventory_management",
    "auto_invoice",
    "role_based_access",
    "multi_branch",
    "advanced_dashboard",
    "performance_reports",
    "custom_workflow",
    "priority_support",
  ],
}

/**
 * Check if a plan has a specific feature
 */
export const hasPlanFeature = (plan: PlanCode | undefined, feature: PlanFeature): boolean => {
  const planCode = plan || DEFAULT_PLAN
  return PLAN_FEATURES[planCode]?.includes(feature) ?? false
}

/**
 * Check if a plan allows a specific limit (used for enforcement)
 */
export const checkPlanLimit = (
  plan: PlanCode | undefined,
  limitType: keyof Plan["limits"],
  currentCount: number
): boolean => {
  const p = getPlan(plan)
  const limit = p.limits[limitType]
  return currentCount < limit
}

/**
 * Get remaining quota for a plan limit
 */
export const getRemainingQuota = (
  plan: PlanCode | undefined,
  limitType: keyof Plan["limits"],
  currentCount: number
): number => {
  const p = getPlan(plan)
  return Math.max(0, p.limits[limitType] - currentCount)
}
