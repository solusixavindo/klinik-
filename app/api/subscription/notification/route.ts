import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getNextBillingDate, getPlan } from "@/lib/billing"
import { isXenditPaidStatus } from "@/lib/xendit"

type XenditInvoiceWebhook = {
  id?: string
  external_id?: string
  status?: string
  amount?: number
  paid_amount?: number
  payer_email?: string
}

const getPlanFromExternalId = (externalId: string) => {
  const parts = externalId.split("-")
  return parts.length >= 4 ? parts[2] : ""
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as XenditInvoiceWebhook
    const callbackToken = req.headers.get("x-callback-token")
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN
    const externalId = body.external_id

    if (!externalId || !body.status) {
      return NextResponse.json(
        { success: false, error: "Payload pembayaran tidak lengkap" },
        { status: 400 }
      )
    }

    if (expectedToken && callbackToken !== expectedToken) {
      return NextResponse.json(
        { success: false, error: "Token webhook pembayaran tidak valid" },
        { status: 401 }
      )
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from("subscription_events")
      .select("clinic_id, metadata")
      .eq("provider_reference", externalId)
      .eq("event_type", "checkout_created")
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: "Checkout subscription tidak ditemukan" },
        { status: 404 }
      )
    }

    const planCode = typeof event.metadata?.plan === "string" ? event.metadata.plan : getPlanFromExternalId(externalId)
    const plan = getPlan(planCode)

    if (isXenditPaidStatus(body.status)) {
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
        event_type: `payment_${body.status.toLowerCase()}`,
        provider: "xendit",
        provider_reference: externalId,
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
