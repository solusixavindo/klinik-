import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

export const runtime = "nodejs"

const MAX_LOGO_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
}

export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    if (auth.role !== "admin") {
      return NextResponse.json({ success: false, error: "Hanya admin yang boleh mengubah logo klinik." }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("logo")

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "File logo wajib dikirim." }, { status: 400 })
    }

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json(
        { success: false, error: "Format logo harus png, jpg, jpeg, atau webp." },
        { status: 400 }
      )
    }

    if (file.size > MAX_LOGO_SIZE) {
      return NextResponse.json({ success: false, error: "Ukuran logo maksimal 2MB." }, { status: 400 })
    }

    const path = `${auth.clinicId}/logo.${ext}`
    const bytes = new Uint8Array(await file.arrayBuffer())
    const { error: uploadError } = await supabaseAdmin.storage
      .from("clinic-logos")
      .upload(path, bytes, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json(
        {
          success: false,
          error:
            uploadError.message.includes("Bucket not found")
              ? "Bucket clinic-logos belum tersedia. Jalankan SQL clinic_branding.sql di Supabase."
              : uploadError.message,
        },
        { status: 500 }
      )
    }

    const { data: publicUrl } = supabaseAdmin.storage.from("clinic-logos").getPublicUrl(path)
    const logoUrl = `${publicUrl.publicUrl}?v=${Date.now()}`

    const { data: clinic, error: updateError } = await supabaseAdmin
      .from("clinics")
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq("id", auth.clinicId)
      .select("id, name, logo_url")
      .single()

    if (updateError || !clinic) {
      throw updateError || new Error("Logo berhasil diupload, tetapi gagal menyimpan URL logo.")
    }

    return NextResponse.json({ success: true, clinic })
  } catch (err: unknown) {
    console.error("Upload clinic logo failed", err)
    const message = err instanceof Error ? err.message : "Gagal upload logo klinik"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
