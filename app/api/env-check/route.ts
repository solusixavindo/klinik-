import { NextResponse } from "next/server"
import { getSupabaseEnvCheck } from "@/lib/supabaseEnv"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json(getSupabaseEnvCheck())
}
