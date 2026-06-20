import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"
import * as midtransClient from "midtrans-client"

const MIDTRANS_CLIENT_KEY =
  process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY

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

    if (!process.env.MIDTRANS_SERVER_KEY || !MIDTRANS_CLIENT_KEY) {
      return NextResponse.json(
        { error: "MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY belum dikonfigurasi" },
        { status: 500 }
      )
    }

    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: MIDTRANS_CLIENT_KEY,
    })

    const orderId = `BOOK-${data.id}-${Date.now()}`

    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: data.price,
      },
    })

    return NextResponse.json({
      redirect_url: transaction.redirect_url,
    })
  } catch (err: unknown) {
    console.error(err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan pembayaran"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
