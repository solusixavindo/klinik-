"use client"

import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"

type Props = {
  type: string
  date?: string
  month?: string
  filename?: string
}

export default function ExportButton({ type, date, month, filename }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<"csv" | "pdf" | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const doExport = async (format: "csv" | "pdf") => {
    setOpen(false)
    setLoading(format)
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const params = new URLSearchParams({ type, format })
      if (date) params.set("date", date)
      if (month) params.set("month", month)

      const res = await fetch(`/api/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? "Gagal export")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const period = date ?? month ?? "export"
      const base = filename ?? `laporan-${type}-${period}`
      a.href = url
      a.download = `${base}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal export"
      alert(msg)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading !== null}
        className="flex items-center gap-1.5 rounded-xl border border-slate-600/40 bg-slate-800/60 px-3.5 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/60 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            Mengunduh...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export
            <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-36 rounded-xl border border-slate-700/40 bg-slate-800 py-1 shadow-xl">
          <button
            onClick={() => doExport("csv")}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-slate-200 hover:bg-slate-700/60"
          >
            <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            CSV (Excel)
          </button>
          <button
            onClick={() => doExport("pdf")}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-slate-200 hover:bg-slate-700/60"
          >
            <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            PDF
          </button>
        </div>
      )}
    </div>
  )
}
