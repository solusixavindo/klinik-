import { NextResponse } from "next/server"
import { getSupabaseEnvStatus } from "@/lib/supabaseEnv"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json(getSupabaseEnvStatus())
}
