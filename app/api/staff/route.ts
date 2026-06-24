import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"
import type { UserRole } from "@/lib/roleAccess"
import { STAFF_ROLES } from "@/lib/roleAccess"

// GET — list semua staff di klinik ini
export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

    if (auth.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses ditolak — hanya admin" }, { status: 403 })
    }

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, role, full_name, created_at")
      .eq("clinic_id", auth.clinicId)
      .order("created_at", { ascending: true })

    if (error) throw error

    // Ambil email dari auth.users
    const ids = (profiles ?? []).map((p) => p.id)
    const emailMap: Record<string, string> = {}
    for (const id of ids) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(id)
      if (u?.user?.email) emailMap[id] = u.user.email
    }

    const staff = (profiles ?? []).map((p) => ({
      id: p.id,
      name: p.full_name ?? emailMap[p.id] ?? "-",
      email: emailMap[p.id] ?? "-",
      role: (p.role as UserRole) ?? "admin",
      joined_at: p.created_at,
    }))

    return NextResponse.json({ success: true, staff })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST — undang staff baru
export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

    if (auth.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses ditolak — hanya admin" }, { status: 403 })
    }

    const body = await req.json()
    const { email, role, name } = body as { email?: string; role?: string; name?: string }

    if (!email || !role || !name) {
      return NextResponse.json({ success: false, error: "Email, nama, dan role wajib diisi" }, { status: 400 })
    }

    if (!STAFF_ROLES.includes(role as UserRole)) {
      return NextResponse.json({ success: false, error: "Role tidak valid" }, { status: 400 })
    }

    // Kirim invite email via Supabase
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/login`,
    })

    if (inviteError || !inviteData.user) {
      throw inviteError ?? new Error("Gagal mengirim undangan")
    }

    // Buat profile dengan role yang dipilih
    const { error: profileError } = await supabaseAdmin.from("profiles").insert([
      {
        id: inviteData.user.id,
        clinic_id: auth.clinicId,
        role: role as UserRole,
        full_name: name,
      },
    ])

    if (profileError) throw profileError

    return NextResponse.json({ success: true, user_id: inviteData.user.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PATCH — update role staff
export async function PATCH(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

    if (auth.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses ditolak — hanya admin" }, { status: 403 })
    }

    const body = await req.json()
    const { id, role } = body as { id?: string; role?: string }

    if (!id || !role) {
      return NextResponse.json({ success: false, error: "id dan role wajib diisi" }, { status: 400 })
    }

    if (!["admin", ...STAFF_ROLES].includes(role as UserRole)) {
      return NextResponse.json({ success: false, error: "Role tidak valid" }, { status: 400 })
    }

    // Pastikan staff ini milik klinik yang sama
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("clinic_id")
      .eq("id", id)
      .single()

    if (checkError || !existing || existing.clinic_id !== auth.clinicId) {
      return NextResponse.json({ success: false, error: "Staff tidak ditemukan di klinik ini" }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ role: role as UserRole })
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE — hapus/nonaktifkan staff
export async function DELETE(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

    if (auth.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses ditolak — hanya admin" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "id wajib diisi" }, { status: 400 })
    }

    // Jangan hapus diri sendiri
    if (id === auth.user.id) {
      return NextResponse.json({ success: false, error: "Tidak bisa menghapus akun sendiri" }, { status: 400 })
    }

    // Pastikan staff ini milik klinik yang sama
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("clinic_id")
      .eq("id", id)
      .single()

    if (checkError || !existing || existing.clinic_id !== auth.clinicId) {
      return NextResponse.json({ success: false, error: "Staff tidak ditemukan di klinik ini" }, { status: 404 })
    }

    // Hapus profile lalu user
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
    if (profileError) throw profileError

    const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (userError) throw userError

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
