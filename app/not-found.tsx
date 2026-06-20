import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">404</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mt-4 text-slate-300">
          Link yang dibuka tidak tersedia atau sudah berubah. Kembali ke beranda untuk melanjutkan.
        </p>
        <Link href="/" className="mt-8 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold hover:bg-indigo-500">
          Kembali ke Beranda
        </Link>
      </section>
    </main>
  )
}
