import Link from "next/link"

export default function BookIndexPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto flex max-w-3xl flex-col items-start gap-6">
        <Link href="/" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">
          XaviKlinika
        </Link>
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">Booking Online</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Temukan halaman booking klinik Anda.</h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Halaman booking publik tersedia melalui alamat khusus klinik, misalnya
            <span className="font-semibold text-white"> /book/nama-klinik</span>. Hubungi klinik untuk mendapatkan link
            booking yang benar.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold hover:bg-indigo-500">
            Daftarkan Klinik
          </Link>
          <Link href="/login" className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500">
            Masuk Dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}
