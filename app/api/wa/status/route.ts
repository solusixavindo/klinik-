import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

export async function GET(req: Request) {
  const auth = await getClinicFromRequest(req)
  if ("clinicId" in auth) {
    const { data } = await supabaseAdmin
      .from("clinics")
      .select("fonnte_token")
      .eq("id", auth.clinicId)
      .single()
    const connected = !!(data?.fonnte_token || process.env.FONNTE_TOKEN)
    return NextResponse.json({ connected })
  }
  return NextResponse.json({ connected: !!process.env.FONNTE_TOKEN })
}
