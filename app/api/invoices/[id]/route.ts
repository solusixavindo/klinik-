import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Sesi login tidak ditemukan" },
        { status: 401 }
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
      .select("clinic_id")
      .eq("id", userData.user.id)
      .single()

    if (profileError || !profile?.clinic_id) {
      return NextResponse.json(
        { success: false, error: "Data klinik tidak ditemukan" },
        { status: 403 }
      )
    }

    const [{ data: invoice, error }, clinicResult] = await Promise.all([
      supabaseAdmin
        .from("bookings")
        .select("*, patients(name, phone), doctors(name)")
        .eq("id", id)
        .eq("clinic_id", profile.clinic_id)
        .single(),
      supabaseAdmin
        .from("clinics")
        .select("name, bank_account, bank_name, bank_holder")
        .eq("id", profile.clinic_id)
        .single(),
    ])
    // Gracefully handle if bank columns don't exist yet
    const clinic = clinicResult.error ? null : clinicResult.data

    if (error || !invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, invoice, clinic })
  } catch (err: unknown) {
    console.error("Fetch invoice failed", err)
    const message = err instanceof Error ? err.message : "Gagal mengambil invoice"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
