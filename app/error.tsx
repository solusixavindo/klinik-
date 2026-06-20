"use client"

import Link from "next/link"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Terjadi Kesalahan</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Aplikasi belum bisa memuat halaman ini</h1>
        <p className="mt-4 text-slate-300">
          Coba muat ulang halaman. Jika masih terjadi, periksa konfigurasi environment dan koneksi Supabase.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={reset} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold hover:bg-indigo-500">
            Coba Lagi
          </button>
          <Link href="/" className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500">
            Ke Beranda
          </Link>
        </div>
      </section>
    </main>
  )
}
