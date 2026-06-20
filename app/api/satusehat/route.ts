import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"
import { getSatuSehatToken, SATUSEHAT_BASE_URL } from "@/lib/satusehat"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("satusehat_enabled, satusehat_org_id, satusehat_client_id, satusehat_client_secret")
      .eq("id", auth.clinicId)
      .single()

    if (clinicError) throw clinicError

    const { data: stats } = await supabaseAdmin
      .from("satusehat_queue")
      .select("status")
      .eq("clinic_id", auth.clinicId)

    const statsCounts = { pending: 0, sent: 0, failed: 0 }
    for (const row of stats ?? []) {
      const s = row.status as string
      if (s === "pending") statsCounts.pending++
      else if (s === "sent") statsCounts.sent++
      else if (s === "failed") statsCounts.failed++
    }

    const { data: lastSentRow } = await supabaseAdmin
      .from("satusehat_queue")
      .select("sent_at")
      .eq("clinic_id", auth.clinicId)
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(1)
      .single()

    const hasCredentials =
      clinic?.satusehat_client_id && clinic?.satusehat_client_secret

    let connectionStatus = "not_configured"
    if (clinic?.satusehat_enabled && hasCredentials) {
      connectionStatus = "configured"
    } else if (clinic?.satusehat_enabled && !hasCredentials) {
      connectionStatus = "demo"
    }

    return NextResponse.json({
      enabled: clinic?.satusehat_enabled ?? false,
      org_id: clinic?.satusehat_org_id ?? null,
      stats: statsCounts,
      last_sync: lastSentRow?.sent_at ?? null,
      connection_status: connectionStatus,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil status"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("satusehat_enabled, satusehat_client_id, satusehat_client_secret, satusehat_org_id")
      .eq("id", auth.clinicId)
      .single()

    if (clinicError) throw clinicError

    const { data: pendingItems } = await supabaseAdmin
      .from("satusehat_queue")
      .select("id, resource_type, resource_id, payload, attempts")
      .eq("clinic_id", auth.clinicId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10)

    if (!pendingItems || pendingItems.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: "Tidak ada item yang perlu disinkronisasi" })
    }

    const isDemo = !clinic?.satusehat_enabled || !clinic?.satusehat_client_id || !clinic?.satusehat_client_secret

    if (isDemo) {
      // Demo mode: mark all as sent
      const ids = pendingItems.map((i) => i.id as string)
      await supabaseAdmin
        .from("satusehat_queue")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: "demo mode" })
        .in("id", ids)

      return NextResponse.json({
        success: true,
        processed: ids.length,
        mode: "demo",
        message: `${ids.length} item ditandai terkirim (demo mode — kredensial belum dikonfigurasi)`,
      })
    }

    // Real mode: get token and send
    const token = await getSatuSehatToken(
      clinic.satusehat_client_id as string,
      clinic.satusehat_client_secret as string,
      "production"
    )

    if (!token) {
      return NextResponse.json({ success: false, error: "Gagal mendapatkan token dari SATU SEHAT. Periksa Client ID dan Client Secret." }, { status: 400 })
    }

    let successCount = 0
    let failCount = 0

    for (const item of pendingItems) {
      const resourceType = item.resource_type as string
      const endpoint = `${SATUSEHAT_BASE_URL.production}/fhir-r4/v1/${resourceType}`

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(item.payload),
        })

        if (res.ok) {
          await supabaseAdmin
            .from("satusehat_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              attempts: (item.attempts as number) + 1,
              last_error: null,
            })
            .eq("id", item.id as string)
          successCount++
        } else {
          const errText = await res.text()
          await supabaseAdmin
            .from("satusehat_queue")
            .update({
              status: "failed",
              attempts: (item.attempts as number) + 1,
              last_error: `HTTP ${res.status}: ${errText.slice(0, 200)}`,
            })
            .eq("id", item.id as string)
          failCount++
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Network error"
        await supabaseAdmin
          .from("satusehat_queue")
          .update({
            status: "failed",
            attempts: (item.attempts as number) + 1,
            last_error: msg,
          })
          .eq("id", item.id as string)
        failCount++
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingItems.length,
      sent: successCount,
      failed: failCount,
      message: `Sinkronisasi selesai: ${successCount} berhasil, ${failCount} gagal`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal sinkronisasi"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
