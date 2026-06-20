import { PlanFeature } from "@/lib/billing"

export type DashboardMenuItem = {
  href: string
  label: string
  icon: string
  description: string
  requiredFeature?: PlanFeature
}

export type DashboardMenuGroup = {
  title: string
  items: DashboardMenuItem[]
}

export const primaryMenu: DashboardMenuItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: "▦",
    description: "Ringkasan aktivitas klinik",
  },
]

export const dashboardMenuGroups: DashboardMenuGroup[] = [
  {
    title: "Laporan",
    items: [
      { href: "/laporan/harian", label: "Laporan Harian", icon: "▤", description: "Ringkasan operasional klinik per hari", requiredFeature: "operational_reports" },
      { href: "/laporan/pendaftaran", label: "Laporan Pendaftaran", icon: "▥", description: "Analisis pendaftaran pasien", requiredFeature: "operational_reports" },
      { href: "/laporan/pelayanan", label: "Laporan Pelayanan", icon: "▧", description: "Rekap layanan dan performa poli", requiredFeature: "operational_reports" },
      { href: "/laporan/pendapatan", label: "Laporan Pendapatan", icon: "▩", description: "Pantau pemasukan klinik", requiredFeature: "financial_reports" },
      { href: "/laporan/kasir", label: "Laporan Kasir", icon: "▣", description: "Audit transaksi kasir", requiredFeature: "cashier_system" },
      { href: "/laporan/operasional", label: "Laporan Operasional", icon: "▨", description: "Kontrol indikator operasional", requiredFeature: "operational_reports" },
      { href: "/laporan/sla-waktu-tunggu", label: "Laporan SLA (Waktu Tunggu)", icon: "◷", description: "Pantau standar waktu tunggu", requiredFeature: "performance_reports" },
      { href: "/laporan/laba-rugi", label: "Laporan Laba Rugi", icon: "◇", description: "Evaluasi profitabilitas klinik", requiredFeature: "financial_reports" },
      { href: "/laporan/penjualan-farmasi", label: "Laporan Penjualan Farmasi", icon: "□", description: "Rekap penjualan obat dan farmasi", requiredFeature: "inventory_management" },
    ],
  },
  {
    title: "Pendaftaran",
    items: [
      { href: "/patients", label: "Pendaftaran Rawat Jalan", icon: "◇", description: "Tambah dan kelola data pasien", requiredFeature: "patient_management" },
      { href: "/doctors", label: "Data Dokter", icon: "▧", description: "Tambah dan kelola data dokter klinik", requiredFeature: "doctor_schedule" },
      { href: "/schedules", label: "Manajemen Jadwal Dokter", icon: "▤", description: "Atur jadwal praktik dokter", requiredFeature: "doctor_schedule" },
      { href: "/bookings", label: "Booking Sederhana", icon: "◌", description: "Buat dan kelola booking kunjungan pasien", requiredFeature: "booking_system" },
      { href: "/pendaftaran/bpjs", label: "Pendaftaran BPJS", icon: "▥", description: "Registrasi pasien BPJS sederhana untuk paket Standard", requiredFeature: "bpjs_registration" },
      { href: "/pendaftaran/private-booking-online", label: "Private Booking Online", icon: "◈", description: "Booking khusus untuk pasien privat", requiredFeature: "online_booking" },
      { href: "/pendaftaran/mandiri-e-kios", label: "Pendaftaran Mandiri (E-Kios)", icon: "▣", description: "Alur registrasi pasien mandiri", requiredFeature: "online_booking" },
      { href: "/pendaftaran/lab-radiologi", label: "Pendaftaran Lab & Radiologi", icon: "◇", description: "Registrasi pemeriksaan penunjang", requiredFeature: "online_booking" },
    ],
  },
  {
    title: "Pelayanan",
    items: [
      { href: "/pelayanan/rekam-medis-elektronik", label: "Rekam Medis Elektronik", icon: "▤", description: "Catatan medis digital pasien", requiredFeature: "medical_records" },
      { href: "/pelayanan/e-resep", label: "E-Resep", icon: "□", description: "Resep digital dan farmasi", requiredFeature: "inventory_management" },
      { href: "/pelayanan/rawat-jalan-poliklinik", label: "Rawat Jalan / Poliklinik", icon: "▥", description: "Workflow pelayanan poli", requiredFeature: "medical_records" },
      { href: "/pelayanan/antrian-poli", label: "Antrian Loket & Poli", icon: "◌", description: "Pantau antrean loket, poli, dan apotek", requiredFeature: "queue_management" },
      { href: "/pelayanan/laboratorium", label: "Laboratorium", icon: "△", description: "Kelola permintaan dan hasil lab", requiredFeature: "inventory_management" },
    ],
  },
  {
    title: "Operasional",
    items: [
      { href: "/invoice", label: "Pembayaran Pasien", icon: "▩", description: "Invoice dan pembayaran pasien", requiredFeature: "cashier_system" },
      { href: "/billing", label: "Paket & Langganan", icon: "◈", description: "Kelola paket bulanan klinik" },
      { href: "/operasional/piutang-pasien", label: "Piutang Pasien", icon: "▨", description: "Pantau tagihan belum lunas", requiredFeature: "cashier_system" },
      { href: "/operasional/bridging-bpjs", label: "Bridging BPJS", icon: "▥", description: "SEP, rujukan, antrean, klaim, dan integrasi VClaim", requiredFeature: "bpjs_bridging" },
      { href: "/operasional/stok-obat", label: "Stok Obat", icon: "□", description: "Monitor persediaan farmasi", requiredFeature: "inventory_management" },
      { href: "/operasional/notifikasi", label: "Notifikasi / Informasi", icon: "◇", description: "Pusat informasi klinik", requiredFeature: "operational_reports" },
      { href: "/operasional/reminder-wa", label: "Reminder WhatsApp", icon: "💬", description: "Kirim pengingat kunjungan via WhatsApp", requiredFeature: "booking_system" },
      { href: "/operasional/tagihan-recurring", label: "Tagihan Berulang", icon: "🔄", description: "Kelola tagihan otomatis pasien rawat jalan rutin" },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      { href: "/pengaturan", label: "Pengaturan Klinik", icon: "⚙", description: "Kelola informasi dan preferensi klinik" },
      { href: "/pengaturan/cabang", label: "Manajemen Cabang", icon: "🏢", description: "Kelola cabang klinik (Premium)", requiredFeature: "multi_branch" },
      { href: "/pengaturan/booking-online", label: "Booking Online", icon: "🔗", description: "Link booking publik untuk pasien" },
      { href: "/pengaturan/notifikasi-wa", label: "Notifikasi WhatsApp", icon: "📱", description: "Konfigurasi pesan otomatis ke pasien" },
      { href: "/pengaturan/staff", label: "Manajemen Staff", icon: "👤", description: "Undang dan kelola akses tim klinik", requiredFeature: "multi_staff" },
      { href: "/pengaturan/satusehat", label: "SATU SEHAT", icon: "🏛️", description: "Integrasi platform Kemenkes RI" },
    ],
  },
]

export const allDashboardMenuItems = [
  ...primaryMenu,
  ...dashboardMenuGroups.flatMap((group) => group.items),
]

export const findMenuItemByPath = (path: string) =>
  allDashboardMenuItems.find((item) => item.href === path)

export const findMenuItemBySlug = (section: string, slug: string) =>
  dashboardMenuGroups
    .find((group) => group.title.toLowerCase() === section)
    ?.items.find((item) => item.href === `/${section}/${slug}`)
