"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"

type Branch = {
  id: string
  name: string
  is_active: boolean
}

const STORAGE_KEY = "active_branch_id"

export default function BranchSwitcher() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    setActiveBranchId(stored)

    const load = async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) return
      const res = await fetch("/api/branches", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) {
        setBranches((data.branches ?? []).filter((b: Branch) => b.is_active))
      }
      setLoaded(true)
    }

    load()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Only show if clinic has more than 1 active branch
  if (!loaded || branches.length <= 1) return null

  const activeBranch = branches.find((b) => b.id === activeBranchId)
  const displayName = activeBranch?.name ?? "Cabang Utama"

  const handleSwitch = (id: string | null) => {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setOpen(false)
    window.location.reload()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-slate-700/40 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-indigo-400">🏢</span>
        <span className="max-w-[120px] truncate">{displayName}</span>
        <span className="text-slate-500 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-2xl border border-slate-700/40 bg-slate-900 shadow-xl overflow-hidden">
          {/* Cabang Utama option */}
          <button
            onClick={() => handleSwitch(null)}
            className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-slate-800/60 transition-colors ${!activeBranchId ? "text-indigo-300 font-semibold" : "text-slate-300"}`}
          >
            <span className="text-xs">🏠</span>
            <span>Cabang Utama</span>
            {!activeBranchId && <span className="ml-auto text-xs text-indigo-400">✓</span>}
          </button>

          <div className="border-t border-slate-700/30" />

          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => handleSwitch(branch.id)}
              className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-slate-800/60 transition-colors ${activeBranchId === branch.id ? "text-indigo-300 font-semibold" : "text-slate-300"}`}
            >
              <span className="text-xs">🏢</span>
              <span className="truncate">{branch.name}</span>
              {activeBranchId === branch.id && <span className="ml-auto text-xs text-indigo-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
