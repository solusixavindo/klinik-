import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { data: clinic, error } = await supabaseAdmin
      .from("clinics")
      .select("satusehat_enabled, satusehat_org_id, satusehat_client_id, satusehat_client_secret")
      .eq("id", auth.clinicId)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      settings: {
        satusehat_enabled: clinic?.satusehat_enabled ?? false,
        satusehat_org_id: clinic?.satusehat_org_id ?? "",
        satusehat_client_id: clinic?.satusehat_client_id ?? "",
        satusehat_client_secret: clinic?.satusehat_client_secret ? "***" : "",
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil pengaturan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = (await req.json()) as {
      satusehat_org_id?: string
      satusehat_client_id?: string
      satusehat_client_secret?: string
      satusehat_enabled?: boolean
    }

    const updateData: Record<string, unknown> = {}
    if (body.satusehat_org_id !== undefined) updateData.satusehat_org_id = body.satusehat_org_id || null
    if (body.satusehat_client_id !== undefined) updateData.satusehat_client_id = body.satusehat_client_id || null
    if (body.satusehat_client_secret !== undefined && body.satusehat_client_secret !== "***") {
      updateData.satusehat_client_secret = body.satusehat_client_secret || null
    }
    if (body.satusehat_enabled !== undefined) updateData.satusehat_enabled = body.satusehat_enabled

    const { error } = await supabaseAdmin
      .from("clinics")
      .update(updateData)
      .eq("id", auth.clinicId)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Pengaturan SATU SEHAT berhasil disimpan" })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan pengaturan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
