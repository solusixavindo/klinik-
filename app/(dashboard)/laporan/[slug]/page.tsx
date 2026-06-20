import { notFound } from "next/navigation"
import { findMenuItemBySlug } from "@/lib/dashboardMenu"
import ModulePlaceholder from "../../_components/ModulePlaceholder"
import LaporanPendapatanPage from "./pendapatan"
import LaporanOperasionalPage from "./operasional"
import LaporanPendaftaranPage from "./pendaftaran"
import LaporanPelayananPage from "./pelayanan"
import LaporanKasirPage from "./kasir"
import LaporanSlaPage from "./sla"
import LaporanLabaRugiPage from "./laba-rugi"
import LaporanFarmasiPage from "./farmasi"

export default async function LaporanPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = findMenuItemBySlug("laporan", slug)
  if (!item) notFound()

  if (slug === "pendapatan") return <LaporanPendapatanPage />
  if (slug === "operasional") return <LaporanOperasionalPage />
  if (slug === "pendaftaran") return <LaporanPendaftaranPage />
  if (slug === "pelayanan") return <LaporanPelayananPage />
  if (slug === "kasir") return <LaporanKasirPage />
  if (slug === "sla-waktu-tunggu") return <LaporanSlaPage />
  if (slug === "laba-rugi") return <LaporanLabaRugiPage />
  if (slug === "penjualan-farmasi") return <LaporanFarmasiPage />

  return <ModulePlaceholder section="Laporan" item={item} />
}
