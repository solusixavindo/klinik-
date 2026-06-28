type XenditInvoiceRequest = {
  externalId: string
  amount: number
  description: string
  payerEmail?: string | null
  customerName?: string | null
  successRedirectUrl?: string
  failureRedirectUrl?: string
  metadata?: Record<string, unknown>
}

type XenditInvoiceResponse = {
  id: string
  external_id: string
  status: string
  invoice_url: string
}

export function hasXenditEnv() {
  return Boolean(process.env.XENDIT_SECRET_KEY?.trim())
}

export function getPublicAppUrl(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || new URL(req.url).origin
}

export async function createXenditInvoice(input: XenditInvoiceRequest): Promise<XenditInvoiceResponse> {
  const secretKey = process.env.XENDIT_SECRET_KEY

  if (!secretKey) {
    throw new Error("XENDIT_SECRET_KEY belum dikonfigurasi")
  }

  const auth = Buffer.from(`${secretKey}:`).toString("base64")
  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: input.externalId,
      amount: input.amount,
      currency: "IDR",
      description: input.description,
      invoice_duration: 86400,
      payer_email: input.payerEmail || undefined,
      customer: input.customerName || input.payerEmail
        ? {
            given_names: input.customerName || input.payerEmail,
            email: input.payerEmail || undefined,
          }
        : undefined,
      success_redirect_url: input.successRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl,
      metadata: input.metadata,
    }),
  })

  const payload = await response.json().catch(() => null) as Partial<XenditInvoiceResponse> & { message?: string; error_code?: string }

  if (!response.ok || !payload?.invoice_url || !payload.id || !payload.external_id) {
    if (response.status === 401 || response.status === 403 || payload?.error_code === "API_KEY_INVALID") {
      throw new Error("XENDIT_SECRET_KEY tidak valid atau tidak punya izin. Periksa API key di dashboard Xendit (xnd_production_... atau xnd_development_...) dan update di Vercel → Environment Variables.")
    }
    throw new Error(payload?.message || `Xendit error ${response.status}`)
  }

  return payload as XenditInvoiceResponse
}

export function isXenditPaidStatus(status?: string) {
  return status === "PAID" || status === "SETTLED"
}
