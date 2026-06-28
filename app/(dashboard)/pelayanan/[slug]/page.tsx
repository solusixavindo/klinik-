import { notFound } from "next/navigation"
import ModulePlaceholder from "../../_components/ModulePlaceholder"
import {
  MedicalRecordsWrapper,
  QueueWrapper,
  CounterQueueWrapper,
  PharmacyQueueWrapper,
  LaboratoryWrapper,
  PrescriptionWrapper,
  OutpatientPolyclinicWrapper,
} from "../../_components/PelayananInteractive"
import { findMenuItemBySlug } from "@/lib/dashboardMenu"

export default async function PelayananPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = findMenuItemBySlug("pelayanan", slug)

  if (!item) notFound()

  // Special handling for premium features - show actual implementation
  if (slug === "rekam-medis-elektronik") {
    return <MedicalRecordsWrapper />
  }

  if (slug === "antrian-poli") {
    return <QueueWrapper />
  }

  if (slug === "antrian-loket") {
    return <CounterQueueWrapper />
  }

  if (slug === "antrian-apotek") {
    return <PharmacyQueueWrapper />
  }

  if (slug === "laboratorium") {
    return <LaboratoryWrapper />
  }

  if (slug === "e-resep") {
    return <PrescriptionWrapper />
  }

  if (slug === "rawat-jalan-poliklinik") {
    return <OutpatientPolyclinicWrapper />
  }

  return <ModulePlaceholder section="Pelayanan" item={item} />
}
