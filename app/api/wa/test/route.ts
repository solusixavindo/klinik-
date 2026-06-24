import { NextResponse } from "next/server"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"
import { sendWhatsApp, WA_TEMPLATES } from "@/lib/whatsapp"

const DUMMY_PARAMS = {
  bookingConfirm: WA_TEMPLATES.bookingConfirm({
    patientName: "Pasien Test",
    doctorName: "dr. Test",
    date: new Date().toISOString().slice(0, 10),
    clinicName: "Klinik",
  }),
  queueCalled: WA_TEMPLATES.queueCalled({
    patientName: "Pasien Test",
    queueNumber: 1,
    poli: "Poli Umum",
  }),
  labReady: WA_TEMPLATES.labReady({
    patientName: "Pasien Test",
    testTypes: ["Darah Lengkap", "Urine Rutin"],
  }),
  reminderH1: WA_TEMPLATES.reminderH1({
    patientName: "Pasien Test",
    doctorName: "dr. Test",
    date: new Date().toISOString().slice(0, 10),
  }),
} as Record<string, string>

export async function POST(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      )
    }

    const body = await req.json() as { phone?: string; template?: string }
    const { phone, template } = body

    if (!phone) {
      return NextResponse.json({ success: false, error: "Nomor HP wajib diisi" }, { status: 400 })
    }

    const message = DUMMY_PARAMS[template ?? "bookingConfirm"] ?? DUMMY_PARAMS["bookingConfirm"]
    const result = await sendWhatsApp(phone, message)

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
