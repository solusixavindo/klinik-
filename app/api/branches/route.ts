import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

export const runtime = "nodejs"

async function checkPremium(clinicId: string) {
  const { data: clinic } = await supabaseAdmin
    .from("clinics")
    .select("plan")
    .eq("id", clinicId)
    .single()
  return ["premium"].includes(clinic?.plan ?? "")
}

export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { data, error } = await supabaseAdmin
      .from("branches")
      .select("*")
      .eq("clinic_id", auth.clinicId)
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, branches: data ?? [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data cabang"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const isPremium = await checkPremium(auth.clinicId)
    if (!isPremium) {
      return NextResponse.json(
        { success: false, error: "Fitur Multi-Cabang hanya tersedia di paket Premium" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, address, phone, pic_name } = body

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Nama cabang wajib diisi" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("branches")
      .insert([{
        clinic_id: auth.clinicId,
        name: name.trim(),
        address: address || null,
        phone: phone || null,
        pic_name: pic_name || null,
        is_active: true,
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, branch: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat cabang"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await req.json()
    const { id, name, address, phone, pic_name, is_active } = body

    if (!id) return NextResponse.json({ success: false, error: "ID wajib diisi" }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (address !== undefined) updates.address = address
    if (phone !== undefined) updates.phone = phone
    if (pic_name !== undefined) updates.pic_name = pic_name
    if (is_active !== undefined) updates.is_active = is_active

    const { data, error } = await supabaseAdmin
      .from("branches")
      .update(updates)
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, branch: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal update cabang"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID wajib diisi" }, { status: 400 })

    // Soft delete: set is_active = false
    const { data, error } = await supabaseAdmin
      .from("branches")
      .update({ is_active: false })
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, branch: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menonaktifkan cabang"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
