import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"
import { createXenditInvoice, getPublicAppUrl, hasXenditEnv } from "@/lib/xendit"

export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)

    if (!("clinicId" in auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { bookingId } = await req.json()

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId wajib diisi" }, { status: 400 })
    }

    const { data } = await supabaseAdmin
      .from("bookings")
      .select("*, patients(name, phone)")
      .eq("id", bookingId)
      .eq("clinic_id", auth.clinicId)
      .single()

    if (!data) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    if (!hasXenditEnv()) {
      return NextResponse.json(
        { error: "Pembayaran belum aktif. Mohon hubungi admin klinik." },
        { status: 500 }
      )
    }

    const externalId = `BOOK-${auth.clinicId}-${data.id}-${Date.now()}`
    const appUrl = getPublicAppUrl(req)
    const invoice = await createXenditInvoice({
      externalId,
      amount: data.price,
      description: `Pembayaran kunjungan ${data.patients?.name || "pasien"}`,
      customerName: data.patients?.name,
      successRedirectUrl: `${appUrl}/invoice?payment=success`,
      failureRedirectUrl: `${appUrl}/invoice?payment=failed`,
      metadata: {
        clinic_id: auth.clinicId,
        booking_id: data.id,
      },
    })

    return NextResponse.json({
      redirect_url: invoice.invoice_url,
      order_id: externalId,
    })
  } catch (err: unknown) {
    console.error(err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan pembayaran"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
