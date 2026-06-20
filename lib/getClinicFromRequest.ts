import type { User } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import type { UserRole } from "@/lib/roleAccess"

export type ClinicAuth =
  | { clinicId: string; user: User; role: UserRole }
  | { error: string; status: number }

/** Resolve clinic_id from Bearer JWT (same pattern as /api/bookings). */
export async function getClinicFromRequest(req: Request): Promise<ClinicAuth> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  if (!token) {
    return { error: "Sesi login tidak ditemukan", status: 401 }
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !userData.user) {
    return { error: "Sesi login tidak valid", status: 401 }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("clinic_id, role")
    .eq("id", userData.user.id)
    .single()

  if (profileError || !profile?.clinic_id) {
    return { error: "Data klinik tidak ditemukan", status: 403 }
  }

  const role = (profile.role as UserRole) ?? "admin"

  return { clinicId: profile.clinic_id, user: userData.user, role }
}
