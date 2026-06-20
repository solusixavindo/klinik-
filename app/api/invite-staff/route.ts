import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { DEFAULT_PLAN, getPlan, getRemainingQuota, PlanCode } from "@/lib/billing"

const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const generatePassword = (length = 12) =>
  Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")

export async function POST(req: Request) {
  try {
    // Verify caller is authenticated
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Sesi login tidak ditemukan" }, { status: 401 })
    }
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ success: false, error: "Sesi login tidak valid" }, { status: 401 })
    }

    const body = await req.json()
    const { email, clinic_id } = body

    if (!email || !clinic_id) {
      return NextResponse.json(
        { success: false, error: "Email dan clinic_id diperlukan" },
        { status: 400 }
      )
    }

    // Ensure requester belongs to this clinic and is admin
    const { data: requesterProfile } = await supabaseAdmin
      .from("profiles")
      .select("clinic_id, role")
      .eq("id", userData.user.id)
      .single()

    if (!requesterProfile || requesterProfile.clinic_id !== clinic_id || requesterProfile.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 })
    }

    // Check plan and staff limit
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("plan")
      .eq("id", clinic_id)
      .single()

    if (clinicError || !clinic) {
      throw clinicError || new Error("Klinik tidak ditemukan")
    }

    const plan = getPlan(clinic.plan || DEFAULT_PLAN)
    const { count: currentStaff, error: countError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinic_id)

    if (countError) throw countError

    const staffCount = currentStaff || 0
    const remaining = getRemainingQuota(clinic.plan as PlanCode | undefined, "staff", staffCount)

    if (remaining <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Paket ${plan.name} sudah mencapai batas staff (${plan.limits.staff} orang). Upgrade paket untuk menambah staff.`,
          current: staffCount,
          limit: plan.limits.staff,
        },
        { status: 403 }
      )
    }

    const password = generatePassword(12)

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error || !data.user) {
      throw error || new Error("Gagal membuat user")
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert([
      {
        id: data.user.id,
        clinic_id,
        role: "staff",
      },
    ])

    if (profileError) {
      throw profileError
    }

    return NextResponse.json({ success: true, password, remaining: remaining - 1 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
