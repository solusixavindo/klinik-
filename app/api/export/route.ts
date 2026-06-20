export const runtime = "nodejs"

import { NextResponse } from "next/server"
import PDFDocument from "pdfkit"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtRp(n: number) {
  return `Rp ${Number(n).toLocaleString("id-ID")}`
}

function escapeCsv(val: unknown): string {
  const s = String(val ?? "")
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(escapeCsv).join(",")]
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(","))
  }
  return lines.join("\n")
}

// Build PDF and return Buffer
async function toPdf(
  title: string,
  period: string,
  headers: string[],
  rows: (string | number)[][]
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 })
    const chunks: Uint8Array[] = []

    doc.on("data", (c: Uint8Array) => chunks.push(c))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const pageW = doc.page.width - 80 // margin*2

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fontSize(18).font("Helvetica-Bold").text("XaviKlinika", { align: "center" })
    doc.fontSize(13).font("Helvetica").text(title, { align: "center" })
    doc.fontSize(10).fillColor("#555").text(`Periode: ${period}`, { align: "center" })
    doc.fontSize(9).text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}`, { align: "center" })
    doc.moveDown(0.8)

    // ── Table ────────────────────────────────────────────────────────────────
    const colW = Math.floor(pageW / headers.length)
    const rowH = 20
    const startX = 40

    const drawRow = (cols: (string | number)[], y: number, isHeader: boolean) => {
      if (isHeader) {
        doc.rect(startX, y, pageW, rowH).fill("#2d3748").fillColor("#fff")
        doc.font("Helvetica-Bold").fontSize(9)
      } else {
        doc.fillColor("#1a202c").font("Helvetica").fontSize(8)
      }

      cols.forEach((col, i) => {
        const x = startX + i * colW
        doc.text(String(col), x + 3, y + 5, {
          width: colW - 6,
          ellipsis: true,
          lineBreak: false,
        })
      })

      // Border bottom
      doc.strokeColor("#cbd5e0").lineWidth(0.5).moveTo(startX, y + rowH).lineTo(startX + pageW, y + rowH).stroke()
    }

    let curY = doc.y

    // Check if we need new page
    const ensureSpace = (needed: number) => {
      if (curY + needed > doc.page.height - 60) {
        doc.addPage()
        curY = 40
      }
    }

    ensureSpace(rowH)
    drawRow(headers, curY, true)
    curY += rowH

    for (const row of rows) {
      ensureSpace(rowH)
      doc.fillColor("#1a202c")
      drawRow(row, curY, false)
      curY += rowH
    }

    doc.moveDown(1.5)
    doc
      .fontSize(8)
      .fillColor("#888")
      .text("Dicetak oleh sistem XaviKlinika", { align: "center" })

    doc.end()
  })
}

// ─── Column config per type ───────────────────────────────────────────────────

type ReportConfig = {
  headers: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toRows: (data: any) => (string | number)[][]
  title: string
  fileSlug: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CONFIGS: Record<string, ReportConfig> = {
  daily: {
    title: "Laporan Harian",
    fileSlug: "harian",
    headers: ["Nama Pasien", "Dokter", "Tanggal", "Status", "Tagihan"],
    toRows: (data) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.bookings ?? []).map((b: any) => [
        b.patients?.name ?? "-",
        b.doctors?.name ?? "-",
        b.visit_date ?? "-",
        b.payment_status ?? "-",
        fmtRp(Number(b.price ?? 0)),
      ]),
  },
  monthly: {
    title: "Laporan Pendapatan Bulanan",
    fileSlug: "pendapatan",
    headers: ["Tanggal", "Kunjungan", "Total Pendapatan", "Sudah Lunas"],
    toRows: (data) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.daily_data ?? []).map((d: any) => [
        d.date,
        d.bookings,
        fmtRp(d.revenue),
        fmtRp(d.paid),
      ]),
  },
  operational: {
    title: "Laporan Operasional",
    fileSlug: "operasional",
    headers: ["Dokter", "Spesialisasi", "Kunjungan", "Pendapatan"],
    toRows: (data) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.by_doctor ?? []).map((d: any) => [
        d.name,
        d.specialization,
        d.bookings,
        fmtRp(d.revenue),
      ]),
  },
  cashier: {
    title: "Laporan Kasir",
    fileSlug: "kasir",
    headers: ["Tanggal", "Lunas", "Belum Bayar", "Sebagian", "Batal", "Revenue"],
    toRows: (data) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.daily_data ?? []).map((d: any) => [
        d.date,
        d.paid,
        d.pending,
        d.partial,
        d.cancelled,
        fmtRp(d.paid * ((data.summary?.revenue_paid ?? 0) / Math.max(1, data.summary?.paid ?? 1))),
      ]),
  },
  registration: {
    title: "Laporan Pendaftaran Pasien",
    fileSlug: "pendaftaran",
    headers: ["Tanggal", "Total Pasien", "BPJS", "Reguler"],
    toRows: (data) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.daily_data ?? []).map((d: any) => [d.date, d.total, d.bpjs, d.regular]),
  },
  service: {
    title: "Laporan Pelayanan",
    fileSlug: "pelayanan",
    headers: ["Dokter", "Kunjungan", "Pasien dengan RM", "Coverage %"],
    toRows: (data) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.by_doctor ?? []).map((d: any) => [
        d.name,
        d.visits,
        d.with_records,
        d.visits > 0 ? `${Math.round((d.with_records / d.visits) * 100)}%` : "0%",
      ]),
  },
  profit_loss: {
    title: "Laporan Laba Rugi",
    fileSlug: "laba-rugi",
    headers: ["Bulan", "Revenue", "Est. HPP", "Laba Kotor", "Margin %"],
    toRows: (data) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.monthly_trend ?? []).map((t: any) => {
        const margin = t.revenue > 0 ? Math.round((t.gross_profit / t.revenue) * 100) : 0
        return [t.month, fmtRp(t.revenue), fmtRp(t.estimated_cost), fmtRp(t.gross_profit), `${margin}%`]
      }),
  },
  pharmacy: {
    title: "Laporan Farmasi",
    fileSlug: "farmasi",
    headers: ["Nama Obat", "Kategori", "Satuan", "Stok", "Harga Jual", "Nilai Stok"],
    toRows: (data) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.items ?? []).map((i: any) => [
        i.name,
        i.category ?? "-",
        i.unit ?? "-",
        i.stock ?? 0,
        fmtRp(Number(i.sell_price ?? 0)),
        fmtRp(Number(i.stock ?? 0) * Number(i.sell_price ?? 0)),
      ]),
  },
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") ?? "daily"
    const format = searchParams.get("format") ?? "csv"
    const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)
    const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7)

    const config = CONFIGS[type]
    if (!config) {
      return NextResponse.json({ success: false, error: "Tipe laporan tidak valid" }, { status: 400 })
    }

    // Fetch data from internal reports API by reconstructing the URL
    const baseUrl = new URL(req.url)
    const reportsUrl = new URL("/api/reports", baseUrl.origin)
    reportsUrl.searchParams.set("type", type)
    reportsUrl.searchParams.set("date", date)
    reportsUrl.searchParams.set("month", month)

    // Forward auth header
    const authHeader = req.headers.get("Authorization") ?? ""
    const reportsRes = await fetch(reportsUrl.toString(), {
      headers: { Authorization: authHeader },
    })
    const data = await reportsRes.json()

    if (!data.success) {
      return NextResponse.json({ success: false, error: data.error ?? "Gagal mengambil data" }, { status: 500 })
    }

    const rows = config.toRows(data)
    const period = type === "daily" ? date : month

    if (format === "csv") {
      const csv = toCsv(config.headers, rows)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="laporan-${config.fileSlug}-${period}.csv"`,
        },
      })
    }

    if (format === "pdf") {
      const pdfBuf = await toPdf(config.title, period, config.headers, rows)
      return new NextResponse(new Uint8Array(pdfBuf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="laporan-${config.fileSlug}-${period}.pdf"`,
        },
      })
    }

    return NextResponse.json({ success: false, error: "Format tidak valid. Gunakan csv atau pdf." }, { status: 400 })
  } catch (err: unknown) {
    console.error("Export failed", err)
    const message = err instanceof Error ? err.message : "Gagal export laporan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
