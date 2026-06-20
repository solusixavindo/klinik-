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

    const { data, error } = await supabaseAdmin
      .from("stock_items")
      .select("*")
      .eq("clinic_id", auth.clinicId)
      .order("name", { ascending: true })

    if (error) throw error

    const lowStock = (data ?? []).filter((i) => i.stock <= i.min_stock)

    return NextResponse.json({ success: true, items: data ?? [], low_stock_count: lowStock.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data stok"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await req.json()
    const { name, category, unit, stock, min_stock, buy_price, sell_price, description } = body

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Nama item wajib diisi" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("stock_items")
      .insert([{
        clinic_id: auth.clinicId,
        name: name.trim(),
        category: category || "obat",
        unit: unit || "pcs",
        stock: Number(stock) || 0,
        min_stock: Number(min_stock) || 10,
        buy_price: Number(buy_price) || 0,
        sell_price: Number(sell_price) || 0,
        description: description || null,
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, item: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambah item"
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
    const { id, stock_change, ...rest } = body

    if (!id) return NextResponse.json({ success: false, error: "ID wajib diisi" }, { status: 400 })

    // Jika ada stock_change (penambahan/pengurangan stok)
    if (stock_change !== undefined) {
      const { data: current } = await supabaseAdmin
        .from("stock_items").select("stock").eq("id", id).eq("clinic_id", auth.clinicId).single()

      if (!current) return NextResponse.json({ success: false, error: "Item tidak ditemukan" }, { status: 404 })

      const newStock = Math.max(0, current.stock + Number(stock_change))
      const { data, error } = await supabaseAdmin
        .from("stock_items")
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq("id", id).eq("clinic_id", auth.clinicId)
        .select().single()
      if (error) throw error
      return NextResponse.json({ success: true, item: data })
    }

    // Update data item
    const { data, error } = await supabaseAdmin
      .from("stock_items")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id).eq("clinic_id", auth.clinicId)
      .select().single()

    if (error) throw error
    return NextResponse.json({ success: true, item: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal update stok"
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

    const { error } = await supabaseAdmin
      .from("stock_items").delete().eq("id", id).eq("clinic_id", auth.clinicId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus item"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
