import { notFound } from "next/navigation"
import ModulePlaceholder from "../../_components/ModulePlaceholder"
import { findMenuItemBySlug } from "@/lib/dashboardMenu"
import StokObatPage from "./stok-obat"
import PiutangPasienPage from "./piutang-pasien"
import BridgingBpjsPage from "./bridging-bpjs"
import NotifikasiPage from "./notifikasi"
import ReminderWaPage from "./reminder-wa"
import TagihanRecurringPage from "./tagihan-recurring"

export default async function OperasionalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = findMenuItemBySlug("operasional", slug)
  if (!item) notFound()

  if (slug === "stok-obat") return <StokObatPage />
  if (slug === "piutang-pasien") return <PiutangPasienPage />
  if (slug === "bridging-bpjs") return <BridgingBpjsPage />
  if (slug === "notifikasi") return <NotifikasiPage />
  if (slug === "reminder-wa") return <ReminderWaPage />
  if (slug === "tagihan-recurring") return <TagihanRecurringPage />

  return <ModulePlaceholder section="Operasional" item={item} />
}
