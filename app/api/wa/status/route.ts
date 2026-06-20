import { NextResponse } from "next/server"

export async function GET() {
  const connected = !!process.env.FONNTE_TOKEN
  return NextResponse.json({ connected })
}
