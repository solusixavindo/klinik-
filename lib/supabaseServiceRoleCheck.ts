import { Buffer } from "node:buffer"
import { NextResponse } from "next/server"
import { friendlySupabaseSetupMessage, getSupabaseEnvCheck } from "@/lib/supabaseEnv"

export function getJwtRoleFromSupabaseKey(key: string): string | undefined {
  try {
    const parts = key.trim().split(".")
    if (parts.length !== 3) return undefined

    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4))
    const payload = JSON.parse(Buffer.from(b64 + pad, "base64").toString("utf8")) as { role?: unknown }

    return typeof payload.role === "string" ? payload.role : undefined
  } catch {
    return undefined
  }
}

export function hasValidSupabaseServiceRoleKey(): boolean {
  return getSupabaseEnvCheck().ready
}

export function serviceRoleMisconfiguredResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      code: "SUPABASE_SERVICE_ROLE_INVALID",
      error: friendlySupabaseSetupMessage,
    },
    { status: 503 }
  )
}
