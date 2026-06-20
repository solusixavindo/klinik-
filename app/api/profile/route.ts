import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import {
  hasValidSupabaseServiceRoleKey,
  serviceRoleMisconfiguredResponse,
} from "@/lib/supabaseServiceRoleCheck"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Profil klinik untuk halaman dashboard — lewat server agar tidak terblokir RLS browser. */
export async function GET(req: Request) {
  try {
    if (!hasValidSupabaseServiceRoleKey()) {
      return serviceRoleMisconfiguredResponse()
    }

    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Sesi tidak ditemukan" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !userData.user) {
      return NextResponse.json({ success: false, error: "Sesi tidak valid" }, { status: 401 })
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*, clinics(name)")
      .eq("id", userData.user.id)
      .maybeSingle()

    if (error) {
      console.error("GET /api/profile:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!profile?.clinic_id) {
      return NextResponse.json({ success: false, error: "Profil atau klinik tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ success: true, profile })
  } catch (err: unknown) {
    console.error("GET /api/profile failed", err)
    const message = err instanceof Error ? err.message : "Gagal memuat profil"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
