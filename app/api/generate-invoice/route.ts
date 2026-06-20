export const runtime = "nodejs"

import { NextResponse } from "next/server"
import PDFDocument from "pdfkit"

export async function POST(req: Request) {
  try {
    const { patient, doctor, date, price } = await req.json()

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
      doc.fontSize(18).text("XaviKlinika", { align: "center" })
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
      doc.text("BCA 123456789 a.n Xavindo")

      doc.moveDown()
      doc.text("Terima kasih 🙏", { align: "center" })

      doc.end()
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat invoice"
    return NextResponse.json({
      error: message,
    })
  }
}