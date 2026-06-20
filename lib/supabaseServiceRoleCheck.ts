import { Buffer } from "node:buffer"
import { NextResponse } from "next/server"

/** Decode role dari JWT Supabase (anon | authenticated | service_role). */
export function getJwtRoleFromSupabaseKey(key: string): string | undefined {
  try {
    const parts = key.split(".")
    if (parts.length < 2) return undefined
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4))
    const json = Buffer.from(b64 + pad, "base64").toString("utf8")
    const payload = JSON.parse(json) as { role?: string }
    return typeof payload.role === "string" ? payload.role : undefined
  } catch {
    return undefined
  }
}

/**
 * False jika key jelas-jelas anon/authenticated (penyebab RLS di server).
 * Key kosong → false. Role tidak terbaca → true (jangan blokir deployment aneh).
 */
export function hasValidSupabaseServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key || key.trim().length < 30) return false
  const role = getJwtRoleFromSupabaseKey(key)
  if (role === "anon" || role === "authenticated") return false
  return true
}

export function serviceRoleMisconfiguredResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      code: "SERVICE_ROLE_INVALID",
      error:
        "SUPABASE_SERVICE_ROLE_KEY di server salah: harus secret \"service_role\" dari Supabase (Settings → API), bukan key \"anon\".",
      hint:
        "Di Hostinger → Environment variables, perbaiki nama variabel persis SUPABASE_SERVICE_ROLE_KEY dan nilainya. Lalu redeploy. Sementara aplikasi akan mencoba simpan jadwal lewat akun login Anda (RLS).",
    },
    { status: 503 }
  )
}
