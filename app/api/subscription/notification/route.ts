import crypto from "crypto"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getNextBillingDate, getPlan } from "@/lib/billing"

type MidtransNotification = {
  order_id?: string
  status_code?: string
  gross_amount?: string
  signature_key?: string
  transaction_status?: string
  fraud_status?: string
}

const isPaidStatus = (status?: string, fraudStatus?: string) =>
  status === "settlement" || (status === "capture" && fraudStatus !== "challenge")

const getPlanFromOrderId = (orderId: string) => {
  const parts = orderId.split("-")
  return parts.length >= 4 ? parts[2] : ""
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MidtransNotification
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body

    if (!order_id || !status_code || !gross_amount) {
      return NextResponse.json(
        { success: false, error: "Payload Midtrans tidak lengkap" },
        { status: 400 }
      )
    }

    if (!process.env.MIDTRANS_SERVER_KEY) {
      return NextResponse.json(
        { success: false, error: "MIDTRANS_SERVER_KEY belum dikonfigurasi" },
        { status: 500 }
      )
    }

    if (!signature_key) {
      return NextResponse.json(
        { success: false, error: "Signature Midtrans wajib dikirim" },
        { status: 401 }
      )
    }

    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
      .digest("hex")

    if (expectedSignature !== signature_key) {
      return NextResponse.json(
        { success: false, error: "Signature Midtrans tidak valid" },
        { status: 401 }
      )
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from("subscription_events")
      .select("clinic_id, metadata")
      .eq("provider_reference", order_id)
      .eq("event_type", "checkout_created")
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: "Checkout subscription tidak ditemukan" },
        { status: 404 }
      )
    }

    const planCode = typeof event.metadata?.plan === "string" ? event.metadata.plan : getPlanFromOrderId(order_id)
    const plan = getPlan(planCode)

    if (isPaidStatus(transaction_status, fraud_status)) {
      const { error: updateError } = await supabaseAdmin
        .from("clinics")
        .update({
          plan: plan.code,
          subscription_status: "active",
          current_period_end: getNextBillingDate(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.clinic_id)

      if (updateError) throw updateError
    }

    await supabaseAdmin.from("subscription_events").insert([
      {
        clinic_id: event.clinic_id,
        event_type: `payment_${transaction_status || "unknown"}`,
        provider: "midtrans",
        provider_reference: order_id,
        metadata: body,
      },
    ])

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("Subscription notification failed", err)
    const message = err instanceof Error ? err.message : "Gagal memproses notifikasi pembayaran"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
