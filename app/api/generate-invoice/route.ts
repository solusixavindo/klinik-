export const runtime = "nodejs"

import { NextResponse } from "next/server"
import PDFDocument from "pdfkit"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

async function getLogoBuffer(logoUrl?: string | null) {
  if (!logoUrl) return null

  try {
    const res = await fetch(logoUrl)
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      )
    }

    const { patient, doctor, date, price, clinicName } = await req.json()
    const { data: clinic } = await supabaseAdmin
      .from("clinics")
      .select("name, logo_url")
      .eq("id", auth.clinicId)
      .single()

    const name = clinic?.name || (typeof clinicName === "string" && clinicName.trim() ? clinicName.trim() : "Klinik")
    const logoBuffer = await getLogoBuffer(clinic?.logo_url)

    const doc = new PDFDocument({ size: "A4", margin: 50 })

    const chunks: Uint8Array[] = []

    return await new Promise<NextResponse>((resolve) => {
      doc.on("data", (chunk: Uint8Array) => {
        chunks.push(chunk)
      })

      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks)

        resolve(
          new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": "attachment; filename=invoice.pdf",
            },
          })
        )
      })

      // ======================
      // DESIGN PDF (UPGRADE)
      // ======================
      if (logoBuffer) {
        doc.image(logoBuffer, 258, 34, { fit: [80, 80] })
        doc.moveDown(5)
      }
      doc.fontSize(18).text(name, { align: "center" })
      doc.moveDown()

      doc.fontSize(14).text("INVOICE", { align: "center" })
      doc.moveDown()

      doc.fontSize(12)
      doc.text(`Pasien: ${patient}`)
      doc.text(`Dokter: ${doctor}`)
      doc.text(`Tanggal: ${date}`)
      doc.text(`Total: Rp ${price}`)

      doc.moveDown()
      doc.text("Pembayaran:")
      doc.text(`BCA 123456789 a.n ${name}`)

      doc.moveDown()
      doc.text("Terima kasih 🙏", { align: "center" })
      doc.fontSize(8).fillColor("#777").text("Powered by Xavindo", { align: "center" })

      doc.end()
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat invoice"
    return NextResponse.json({
      error: message,
    })
  }
}
