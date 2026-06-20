import { notFound } from "next/navigation"
import ModulePlaceholder from "../../_components/ModulePlaceholder"
import { findMenuItemBySlug } from "@/lib/dashboardMenu"
import BpjsPage from "./bpjs"
import PrivateBookingPage from "./private-booking"
import EKiosPage from "./ekios"
import LabRadiologiPage from "./lab-radiologi"

export default async function PendaftaranPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = findMenuItemBySlug("pendaftaran", slug)
  if (!item) notFound()

  if (slug === "bpjs") return <BpjsPage />
  if (slug === "private-booking-online") return <PrivateBookingPage />
  if (slug === "mandiri-e-kios") return <EKiosPage />
  if (slug === "lab-radiologi") return <LabRadiologiPage />

  return <ModulePlaceholder section="Pendaftaran" item={item} />
}
