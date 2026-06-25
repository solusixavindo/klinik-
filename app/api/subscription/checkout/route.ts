import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getPlan, PlanCode } from "@/lib/billing"
import { createXenditInvoice, getPublicAppUrl, hasXenditEnv } from "@/lib/xendit"

type CheckoutRequest = {
  plan?: unknown
}

const paidPlans: PlanCode[] = ["basic", "standard", "pro", "premium"]

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Sesi login tidak ditemukan" },
        { status: 401 }
      )
    }

    const body = (await req.json()) as CheckoutRequest
    const planCode = typeof body.plan === "string" ? body.plan : ""

    if (!paidPlans.includes(planCode as PlanCode)) {
      return NextResponse.json(
        { success: false, error: "Paket tidak valid" },
        { status: 400 }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: "Sesi login tidak valid" },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("clinic_id, role")
      .eq("id", userData.user.id)
      .single()

    if (profileError || !profile?.clinic_id) {
      return NextResponse.json(
        { success: false, error: "Data klinik tidak ditemukan" },
        { status: 403 }
      )
    }

    if (profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Hanya admin klinik yang dapat mengubah paket" },
        { status: 403 }
      )
    }

    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("id, name, billing_email")
      .eq("id", profile.clinic_id)
      .single()

    if (clinicError || !clinic) {
      throw clinicError || new Error("Data klinik tidak ditemukan")
    }

    const plan = getPlan(planCode)

    if (!hasXenditEnv()) {
      return NextResponse.json(
        { success: false, error: "Pembayaran belum aktif. Mohon hubungi tim XaviKlinika untuk aktivasi paket." },
        { status: 503 }
      )
    }

    const externalId = `SUB-${clinic.id}-${plan.code}-${Date.now()}`
    const appUrl = getPublicAppUrl(req)
    const invoice = await createXenditInvoice({
      externalId,
      amount: plan.monthlyPrice,
      description: `Langganan XaviKlinika ${plan.name} - ${clinic.name}`,
      payerEmail: clinic.billing_email,
      customerName: clinic.name,
      successRedirectUrl: `${appUrl}/billing?payment=success`,
      failureRedirectUrl: `${appUrl}/billing?payment=failed`,
      metadata: {
        clinic_id: clinic.id,
        plan: plan.code,
      },
    })

    await supabaseAdmin.from("subscription_events").insert([
      {
        clinic_id: clinic.id,
        event_type: "checkout_created",
        provider: "xendit",
        provider_reference: externalId,
        metadata: {
          plan: plan.code,
          amount: plan.monthlyPrice,
          xendit_invoice_id: invoice.id,
          invoice_url: invoice.invoice_url,
          status: invoice.status,
        },
      },
    ])

    return NextResponse.json({
      success: true,
      redirect_url: invoice.invoice_url,
      order_id: externalId,
    })
  } catch (err: unknown) {
    console.error("Create subscription checkout failed", err)
    const message = err instanceof Error ? err.message : "Gagal membuat pembayaran paket"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
