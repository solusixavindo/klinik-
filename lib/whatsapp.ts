export type WaResult = { success: boolean; phone: string; error?: string }

export async function sendWhatsApp(phone: string, message: string): Promise<WaResult> {
  const token = process.env.FONNTE_TOKEN
  if (!token) return { success: false, phone, error: "FONNTE_TOKEN not set" }

  const phone62 = phone.replace(/^0/, "62").replace(/\D/g, "")

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body: new URLSearchParams({ target: phone62, message }),
    })
    const text = await res.text()
    return { success: text.includes("true"), phone: phone62 }
  } catch (e) {
    return { success: false, phone: phone62, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export const WA_TEMPLATES = {
  bookingConfirm: (params: { patientName: string; doctorName: string; date: string; clinicName: string }) =>
    `Halo ${params.patientName} 👋\n\nBooking Anda telah *dikonfirmasi*:\n🏥 ${params.clinicName}\n👨‍⚕️ Dokter: ${params.doctorName}\n📅 Tanggal: ${params.date}\n\nSilakan datang 15 menit lebih awal. Tunjukkan pesan ini ke resepsionis.\n\nTerima kasih 🙏`,

  queueCalled: (params: { patientName: string; queueNumber: number; poli: string }) =>
    `Halo ${params.patientName} 👋\n\nNomor antrian Anda *${params.queueNumber}* sudah *dipanggil*.\n🏥 ${params.poli}\n\nSilakan segera menuju ruangan. Terima kasih 🙏`,

  labReady: (params: { patientName: string; testTypes: string[] }) =>
    `Halo ${params.patientName} 👋\n\nHasil pemeriksaan laboratorium Anda sudah *siap*:\n🔬 ${params.testTypes.join(", ")}\n\nSilakan hubungi klinik untuk pengambilan hasil. Terima kasih 🙏`,

  reminderH1: (params: { patientName: string; doctorName: string; date: string }) =>
    `Halo ${params.patientName} 👋\n\n*Reminder Kunjungan Besok*\n👨‍⚕️ Dokter: ${params.doctorName}\n📅 Tanggal: ${params.date}\n\nMohon datang 15 menit lebih awal 🙏`,
}
