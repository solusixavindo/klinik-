import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"
import {
  hasValidSupabaseServiceRoleKey,
  serviceRoleMisconfiguredResponse,
} from "@/lib/supabaseServiceRoleCheck"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type ScheduleBody = {
  doctor_id?: unknown
  day?: unknown
  start_time?: unknown
  end_time?: unknown
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

export async function GET(req: Request) {
  try {
    if (!hasValidSupabaseServiceRoleKey()) {
      return serviceRoleMisconfiguredResponse()
    }

    const auth = await getClinicFromRequest(req)

    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { data, error } = await supabaseAdmin
      .from("schedules")
      .select("*, doctors(*)")
      .eq("clinic_id", auth.clinicId)
      .order("day", { ascending: true })

    if (error) {
      console.error("GET /api/schedules supabase:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, schedules: data ?? [] })
  } catch (err: unknown) {
    console.error("GET /api/schedules failed", err)
    const message = err instanceof Error ? err.message : "Gagal mengambil jadwal"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!hasValidSupabaseServiceRoleKey()) {
      return serviceRoleMisconfiguredResponse()
    }

    const auth = await getClinicFromRequest(req)

    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = (await req.json()) as ScheduleBody
    const { doctor_id, day, start_time, end_time } = body

    if (
      !isNonEmptyString(doctor_id) ||
      !isNonEmptyString(day) ||
      !isNonEmptyString(start_time) ||
      !isNonEmptyString(end_time)
    ) {
      return NextResponse.json(
        { success: false, error: "Dokter, hari, jam mulai, dan jam selesai wajib diisi" },
        { status: 400 }
      )
    }

    const clinicId = auth.clinicId

    const { data: doctorRow, error: doctorErr } = await supabaseAdmin
      .from("doctors")
      .select("id")
      .eq("id", doctor_id.trim())
      .eq("clinic_id", clinicId)
      .maybeSingle()

    if (doctorErr) {
      console.error("POST /api/schedules doctor check:", doctorErr)
      return NextResponse.json({ success: false, error: doctorErr.message }, { status: 500 })
    }

    if (!doctorRow) {
      return NextResponse.json(
        { success: false, error: "Dokter tidak terdaftar di klinik ini" },
        { status: 400 }
      )
    }

    const { data: schedule, error } = await supabaseAdmin
      .from("schedules")
      .insert([
        {
          doctor_id: doctor_id.trim(),
          day: day.trim(),
          start_time: start_time.trim(),
          end_time: end_time.trim(),
          clinic_id: clinicId,
        },
      ])
      .select("*, doctors(*)")
      .maybeSingle()

    if (error) {
      console.error("POST /api/schedules insert:", error)
      const msg = error.message
      const hint =
        msg.toLowerCase().includes("row-level security") || msg.toLowerCase().includes("rls")
          ? "Pastikan SUPABASE_SERVICE_ROLE_KEY di Hostinger adalah secret service_role (bukan anon). Tanpa itu, server tidak bisa menulis ke tabel schedules."
          : undefined
      return NextResponse.json({ success: false, error: msg, ...(hint ? { hint } : {}) }, { status: 500 })
    }

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: "Jadwal tidak dikembalikan setelah simpan (cek policy SELECT untuk service_role)." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, schedule })
  } catch (err: unknown) {
    console.error("POST /api/schedules failed", err)
    const message = err instanceof Error ? err.message : "Gagal menyimpan jadwal"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    if (!hasValidSupabaseServiceRoleKey()) {
      return serviceRoleMisconfiguredResponse()
    }

    const auth = await getClinicFromRequest(req)

    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const id = new URL(req.url).searchParams.get("id")
    if (!id?.trim()) {
      return NextResponse.json({ success: false, error: "ID jadwal wajib diisi" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("schedules")
      .delete()
      .eq("id", id.trim())
      .eq("clinic_id", auth.clinicId)

    if (error) {
      console.error("DELETE /api/schedules:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("DELETE /api/schedules failed", err)
    const message = err instanceof Error ? err.message : "Gagal menghapus jadwal"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
