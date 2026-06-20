"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"

type BpjsReg = {
  id: string
  bpjs_number: string
  patient_name: string
  poli: string
  referral_number: string | null
  visit_date: string
  notes: string | null
  status: string
  created_at: string
}

const POLI_LIST = ["Umum", "Gigi", "Anak", "Kandungan", "Penyakit Dalam", "Bedah", "THT", "Mata", "Kulit", "Rehabilitasi Medik"]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  registered: { label: "Aktif", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  active:     { label: "Aktif", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  done:       { label: "Selesai", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  claimed:    { label: "Klaim", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
}

const emptyForm = { bpjs_number: "", patient_name: "", poli: "Umum", sep_number: "", visit_date: "", notes: "" }

function genSepNumber(clinicId: string, existingCount: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const prefix = clinicId.replace(/-/g, "").slice(0, 4).toUpperCase()
  const seq = String(existingCount + 1).padStart(3, "0")
  return `SEP-${prefix}-${date}-${seq}`
}

export default function BridgingBpjsPage() {
  const [tab, setTab] = useState<"sep" | "klaim" | "rekap">("sep")
  const [regs, setRegs] = useState<BpjsReg[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [clinicId, setClinicId] = useState("")

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        supabase.from("profiles").select("clinic_id").eq("id", data.session.user.id).single().then(({ data: p }) => {
          if (p?.clinic_id) setClinicId(p.clinic_id)
        })
      }
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch(`/api/bridging-bpjs?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setRegs(data.registrations)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])

  const handleGenSep = () => {
    setForm((p) => ({ ...p, sep_number: genSepNumber(clinicId, regs.length) }))
  }

  const handleSave = async () => {
    if (!form.bpjs_number.trim() || !form.patient_name.trim()) {
      setError("No. BPJS dan nama peserta wajib diisi")
      return
    }
    setSaving(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/bridging-bpjs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, visit_date: form.visit_date || new Date().toISOString().slice(0, 10) }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan SEP")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    const token = await getToken()
    const res = await fetch("/api/bridging-bpjs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    })
    const data = await res.json()
    if (data.success) load()
    else setError(data.error)
  }

  const f = (v: string, k: string) => setForm((p) => ({ ...p, [k]: v }))

  const done = regs.filter((r) => r.status === "done")
  const claimed = regs.filter((r) => r.status === "claimed")
  const active = regs.filter((r) => r.status === "registered" || r.status === "active")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Operasional</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Bridging BPJS</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary text-sm">↻ Refresh</button>
          {tab === "sep" && (
            <button onClick={() => { setShowForm(true); setForm(emptyForm); setError("") }} className="btn-primary text-sm">
              + Tambah SEP
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-700/20 bg-slate-900/40 p-1 w-fit">
        {(["sep", "klaim", "rekap"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${tab === t ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"}`}>
            {t === "sep" ? "SEP" : t === "klaim" ? "Klaim" : "Rekap Bridging"}
          </button>
        ))}
      </div>

      {/* Month filter */}
      {tab !== "rekap" && (
        <div className="flex items-center gap-3">
          <label className="label text-slate-400 text-xs">Filter Bulan:</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-40" />
        </div>
      )}

      {/* TAB: SEP */}
      {tab === "sep" && (
        <>
          {showForm && (
            <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Tambah SEP Baru</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">No. BPJS Peserta</label>
                  <input type="text" value={form.bpjs_number} onChange={(e) => f(e.target.value, "bpjs_number")} className="input" placeholder="0001234567890" />
                </div>
                <div>
                  <label className="label">Nama Peserta</label>
                  <input type="text" value={form.patient_name} onChange={(e) => f(e.target.value, "patient_name")} className="input" placeholder="Nama lengkap" />
                </div>
                <div>
                  <label className="label">Tanggal SEP</label>
                  <input type="date" value={form.visit_date} onChange={(e) => f(e.target.value, "visit_date")} className="input" />
                </div>
                <div>
                  <label className="label">Poli Tujuan</label>
                  <select value={form.poli} onChange={(e) => f(e.target.value, "poli")} className="input">
                    {POLI_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Nomor SEP</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.sep_number} onChange={(e) => f(e.target.value, "sep_number")} className="input flex-1" placeholder="Atau generate otomatis" />
                    <button type="button" onClick={handleGenSep} className="btn-secondary text-xs px-3">Generate</button>
                  </div>
                </div>
                <div>
                  <label className="label">Diagnosa Awal</label>
                  <input type="text" value={form.notes} onChange={(e) => f(e.target.value, "notes")} className="input" placeholder="Kode ICD-10 / deskripsi diagnosa" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? "Menyimpan..." : "Simpan SEP"}</button>
                <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Batal</button>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
            <div className="border-b border-slate-700/20 p-5 flex items-center justify-between">
              <h2 className="font-semibold text-white">Daftar SEP Bulan {month} ({regs.length})</h2>
            </div>
            {loading ? (
              <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
            ) : regs.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada data SEP untuk bulan ini</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/20 text-xs uppercase tracking-widest text-slate-500">
                      <th className="px-5 py-3 text-left">No. SEP</th>
                      <th className="px-5 py-3 text-left">Peserta</th>
                      <th className="px-5 py-3 text-left">Poli</th>
                      <th className="px-5 py-3 text-left">Tgl. SEP</th>
                      <th className="px-5 py-3 text-left">Diagnosa</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regs.map((r) => {
                      const st = STATUS_MAP[r.status] ?? { label: r.status, color: "bg-slate-700/30 text-slate-300 border-slate-600/30" }
                      return (
                        <tr key={r.id} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                          <td className="px-5 py-3 font-mono text-xs text-slate-300">{r.referral_number || "—"}</td>
                          <td className="px-5 py-3">
                            <p className="font-medium text-white">{r.patient_name}</p>
                            <p className="text-xs text-slate-500">{r.bpjs_number}</p>
                          </td>
                          <td className="px-5 py-3 text-slate-300">{r.poli}</td>
                          <td className="px-5 py-3 text-slate-400">{r.visit_date}</td>
                          <td className="px-5 py-3 text-slate-400 max-w-[160px] truncate">{r.notes || "—"}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${st.color}`}>{st.label}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {r.status === "registered" && (
                                <button onClick={() => handleUpdateStatus(r.id, "done")}
                                  className="rounded-lg border border-emerald-500/30 bg-emerald-600/20 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-600/30">
                                  Selesai
                                </button>
                              )}
                              {r.status === "done" && (
                                <button onClick={() => handleUpdateStatus(r.id, "claimed")}
                                  className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-2 py-1 text-xs text-purple-300 hover:bg-purple-600/30">
                                  Klaim
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB: KLAIM */}
      {tab === "klaim" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
              <p className="text-xs text-slate-400">Total SEP Bulan Ini</p>
              <p className="mt-2 text-2xl font-bold text-white">{regs.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
              <p className="text-xs text-slate-400">Sudah Diklaim</p>
              <p className="mt-2 text-2xl font-bold text-purple-300">{claimed.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
              <p className="text-xs text-slate-400">Siap Diklaim</p>
              <p className="mt-2 text-2xl font-bold text-amber-300">{done.length}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
            <div className="border-b border-slate-700/20 p-5">
              <h2 className="font-semibold text-white">SEP Siap Diklaim ({done.length})</h2>
              <p className="text-xs text-slate-500 mt-1">SEP yang sudah selesai dan belum diproses klaim</p>
            </div>
            {loading ? (
              <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
            ) : done.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Tidak ada SEP yang siap diklaim</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/20 text-xs uppercase tracking-widest text-slate-500">
                      <th className="px-5 py-3 text-left">No. SEP</th>
                      <th className="px-5 py-3 text-left">Peserta</th>
                      <th className="px-5 py-3 text-left">Poli</th>
                      <th className="px-5 py-3 text-left">Tgl. SEP</th>
                      <th className="px-5 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {done.map((r) => (
                      <tr key={r.id} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                        <td className="px-5 py-3 font-mono text-xs text-slate-300">{r.referral_number || "—"}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-white">{r.patient_name}</p>
                          <p className="text-xs text-slate-500">{r.bpjs_number}</p>
                        </td>
                        <td className="px-5 py-3 text-slate-300">{r.poli}</td>
                        <td className="px-5 py-3 text-slate-400">{r.visit_date}</td>
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => handleUpdateStatus(r.id, "claimed")}
                            className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-xs text-purple-300 hover:bg-purple-600/30">
                            Proses Klaim
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: REKAP */}
      {tab === "rekap" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
              <p className="text-xs text-slate-400">Total SEP Bulan Ini</p>
              <p className="mt-2 text-2xl font-bold text-white">{regs.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
              <p className="text-xs text-slate-400">Aktif</p>
              <p className="mt-2 text-2xl font-bold text-blue-300">{active.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
              <p className="text-xs text-slate-400">Berhasil Diklaim</p>
              <p className="mt-2 text-2xl font-bold text-purple-300">{claimed.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
              <p className="text-xs text-slate-400">Menunggu Klaim</p>
              <p className="mt-2 text-2xl font-bold text-amber-300">{done.length}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-indigo-500/20 bg-indigo-950/10 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 text-lg">ℹ</div>
              <div>
                <h3 className="font-semibold text-white">Integrasi VClaim BPJS</h3>
                <p className="text-xs text-slate-400 mt-0.5">Untuk integrasi penuh dengan VClaim BPJS Kesehatan, hubungi tim Xavindo.</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Halaman ini menyimpan data SEP secara lokal dan sudah siap untuk diintegrasikan dengan VClaim API dari BPJS Kesehatan.
              Integrasi VClaim memungkinkan verifikasi eligibilitas peserta, pengiriman klaim secara elektronik, dan sinkronisasi data diagnosa secara otomatis.
            </p>
            <a href="https://xavindo.com/kontak" target="_blank" rel="noopener noreferrer"
              className="inline-block rounded-xl bg-indigo-600/30 border border-indigo-500/30 px-4 py-2 text-sm text-indigo-300 hover:bg-indigo-600/50 transition-colors">
              Hubungi Tim Xavindo →
            </a>
          </div>

          {/* Ringkasan per poli */}
          {regs.length > 0 && (
            <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
              <div className="border-b border-slate-700/20 p-5">
                <h2 className="font-semibold text-white">Distribusi per Poli — {month}</h2>
              </div>
              <div className="p-5 grid gap-2">
                {Object.entries(
                  regs.reduce((acc, r) => { acc[r.poli] = (acc[r.poli] || 0) + 1; return acc }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1]).map(([poli, count]) => (
                  <div key={poli} className="flex items-center gap-3">
                    <span className="w-32 text-sm text-slate-300 truncate">{poli}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800/60 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500/60"
                        style={{ width: `${Math.round((count / regs.length) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
