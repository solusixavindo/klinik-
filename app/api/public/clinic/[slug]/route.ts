import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Fetch clinic by slug (only public-safe fields)
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("id, name, address, phone, slug, online_booking_enabled")
      .eq("slug", slug)
      .maybeSingle()

    if (clinicError) {
      console.error("GET /api/public/clinic/[slug] clinic:", clinicError)
      return NextResponse.json({ success: false, error: clinicError.message }, { status: 500 })
    }

    if (!clinic) {
      return NextResponse.json({ success: false, error: "Klinik tidak ditemukan" }, { status: 404 })
    }

    if (!clinic.online_booking_enabled) {
      return NextResponse.json({ success: false, error: "Booking online tidak aktif untuk klinik ini" }, { status: 403 })
    }

    // Fetch active doctors
    const { data: doctors, error: doctorsError } = await supabaseAdmin
      .from("doctors")
      .select("id, name, specialization, is_active")
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (doctorsError) {
      console.error("GET /api/public/clinic/[slug] doctors:", doctorsError)
      return NextResponse.json({ success: false, error: doctorsError.message }, { status: 500 })
    }

    // Fetch schedules for those doctors
    const doctorIds = (doctors ?? []).map((d) => d.id)
    let schedules: { id: string; doctor_id: string; day: string; start_time: string; end_time: string }[] = []

    if (doctorIds.length > 0) {
      const { data: schedulesData, error: schedulesError } = await supabaseAdmin
        .from("schedules")
        .select("id, doctor_id, day, start_time, end_time")
        .eq("clinic_id", clinic.id)
        .in("doctor_id", doctorIds)
        .order("day", { ascending: true })

      if (schedulesError) {
        console.error("GET /api/public/clinic/[slug] schedules:", schedulesError)
        return NextResponse.json({ success: false, error: schedulesError.message }, { status: 500 })
      }

      schedules = schedulesData ?? []
    }

    return NextResponse.json({
      success: true,
      clinic: {
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
        slug: clinic.slug,
      },
      doctors: doctors ?? [],
      schedules,
    })
  } catch (err: unknown) {
    console.error("GET /api/public/clinic/[slug] failed", err)
    const message = err instanceof Error ? err.message : "Gagal memuat data klinik"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
