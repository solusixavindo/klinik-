export type UserRole = "admin" | "dokter" | "kasir" | "resepsionis" | "apoteker"

export const ROLE_MENU_ACCESS: Record<UserRole, string[]> = {
  admin: ["*"], // semua
  dokter: [
    "/",
    "/pelayanan/rekam-medis-elektronik",
    "/pelayanan/antrian-poli",
    "/pelayanan/e-resep",
    "/pelayanan/rawat-jalan-poliklinik",
    "/schedules",
    "/patients",
  ],
  kasir: [
    "/",
    "/operasional/piutang-pasien",
    "/operasional/stok-obat",
    "/laporan/harian",
    "/laporan/kasir",
    "/bookings",
  ],
  resepsionis: [
    "/",
    "/pendaftaran/bpjs",
    "/pendaftaran/private-booking-online",
    "/pendaftaran/mandiri-e-kios",
    "/pelayanan/antrian-poli",
    "/patients",
    "/bookings",
    "/schedules",
  ],
  apoteker: [
    "/",
    "/operasional/stok-obat",
    "/laporan/penjualan-farmasi",
    "/pelayanan/e-resep",
  ],
}

export const canAccess = (role: UserRole, path: string): boolean => {
  const allowed = ROLE_MENU_ACCESS[role]
  if (allowed.includes("*")) return true
  return allowed.some((a) => path.startsWith(a))
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  dokter: "Dokter",
  kasir: "Kasir",
  resepsionis: "Resepsionis",
  apoteker: "Apoteker",
}

export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  admin: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
  dokter: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  kasir: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  resepsionis: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  apoteker: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
}

export const ALL_ROLES: UserRole[] = ["admin", "dokter", "kasir", "resepsionis", "apoteker"]
export const STAFF_ROLES: UserRole[] = ["dokter", "kasir", "resepsionis", "apoteker"]
