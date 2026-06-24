import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSupabaseEnvCheck } from "@/lib/supabaseEnv"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type TableCheck = {
  ok: boolean
  reason?: string
}

function classifySupabaseError(message?: string): string {
  const lower = (message || "").toLowerCase()

  if (lower.includes("jwt") || lower.includes("invalid api key") || lower.includes("invalid token")) {
    return "service role invalid"
  }

  if (lower.includes("permission denied") || lower.includes("row-level security")) {
    return "permission denied"
  }

  if (lower.includes("relation") && lower.includes("does not exist")) {
    return "table missing"
  }

  if (lower.includes("schema cache")) {
    return "table missing or schema cache issue"
  }

  return message || "unknown error"
}

async function checkTable(table: "clinics" | "profiles"): Promise<TableCheck> {
  const { error } = await supabaseAdmin
    .from(table)
    .select("id", { count: "exact", head: true })
    .limit(1)

  if (!error) return { ok: true }

  return {
    ok: false,
    reason: table === "clinics" || table === "profiles"
      ? `${table} ${classifySupabaseError(error.message)}`
      : classifySupabaseError(error.message),
  }
}

export async function GET() {
  const env = getSupabaseEnvCheck()

  if (!env.ready) {
    return NextResponse.json({
      ready: false,
      env,
      tables: {
        clinics: { ok: false, reason: "skipped: env not ready" },
        profiles: { ok: false, reason: "skipped: env not ready" },
      },
      reason: env.reason,
    })
  }

  const [clinics, profiles] = await Promise.all([
    checkTable("clinics"),
    checkTable("profiles"),
  ])

  const ready = env.ready && clinics.ok && profiles.ok
  const reason = !clinics.ok
    ? clinics.reason
    : !profiles.ok
      ? profiles.reason
      : undefined

  return NextResponse.json({
    ready,
    env,
    tables: { clinics, profiles },
    ...(reason ? { reason } : {}),
  })
}
