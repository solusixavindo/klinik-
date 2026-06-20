import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Booking Online - Klinik",
  description: "Buat janji dokter secara online",
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
