import { NextResponse } from "next/server"

export async function POST(req: Request) {
  await req.text().catch(() => "")

  return NextResponse.json(
    {
      success: false,
      error: "Endpoint lama sudah dinonaktifkan. Gunakan halaman register resmi untuk membuat trial.",
    },
    { status: 410 }
  )
}
