"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { hasPlanFeature, PlanCode } from "@/lib/billing"

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
const getToken = async () =>
  (await supabase.auth.getSession()).data.session?.access_token

type QueueEntry = {
  id: string
  queue_number: number
  status: string
  patient_id: string
  doctor_id: string | null
  patients: { name: string } | null
  doctors: { name: string } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER wrappers (kept for backward compatibility / non-implemented slugs)
// ─────────────────────────────────────────────────────────────────────────────
export function MedicalRecordsWrapper() {
  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Rekam Medis Elektronik</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Fitur premium tersedia untuk paket Professional.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 shadow-md">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏥</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Rekam Medis Elektronik Premium</h3>
            <p className="text-slate-400 mb-6">Catatan medis digital lengkap dengan riwayat, diagnosis, dan treatment plan.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function QueueWrapper() {
  return <SubQueueView title="Antrian Poli" icon="🏥" type="poli" />
}

function SubQueueView({ title, icon, type }: { title: string; icon: string; type: string }) {
  const today = new Date().toISOString().slice(0, 10)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [calling, setCalling] = useState<string | null>(null)
  const [currentNumber, setCurrentNumber] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/queue?type=${type}&date=${today}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) {
        setQueue(data.queue ?? [])
        const serving = (data.queue ?? []).find((q: QueueEntry) => q.status === "serving")
        setCurrentNumber(serving?.queue_number ?? null)
      }
    } catch {
      setError("Gagal memuat antrian")
    } finally {
      setLoading(false)
    }
  }, [today, type])

  useEffect(() => { load() }, [load])

  const callNext = async () => {
    const waiting = queue.filter((q) => q.status === "waiting").sort((a, b) => a.queue_number - b.queue_number)
    if (!waiting.length) return
    const next = waiting[0]
    setCalling(next.id)
    try {
      const token = await getToken()
      await fetch("/api/queue", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: next.id, status: "called" }),
      })
      await load()
    } finally {
      setCalling(null)
    }
  }

  const waiting = queue.filter((q) => q.status === "waiting").length
  const serving = queue.filter((q) => q.status === "serving").length
  const done = queue.filter((q) => q.status === "done" || q.status === "paid").length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{icon} {title}</h1>
        </div>
        <button onClick={callNext} disabled={!!calling || waiting === 0}
          className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition">
          {calling ? "Memanggil…" : "Panggil Berikutnya"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Menunggu", val: waiting, color: "text-amber-400" }, { label: "Dilayani", val: serving, color: "text-sky-400" }, { label: "Selesai", val: done, color: "text-emerald-400" }].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-700/20 bg-slate-800/30 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="mt-1 text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {currentNumber !== null && (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-4 text-center">
          <p className="text-xs text-slate-400">Sedang Dilayani</p>
          <p className="mt-1 text-4xl font-bold text-sky-300">{String(currentNumber).padStart(3, "0")}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" /></div>
      ) : error ? (
        <p className="text-center text-sm text-rose-400">{error}</p>
      ) : queue.length === 0 ? (
        <p className="py-8 text-center text-slate-500">Belum ada antrian hari ini</p>
      ) : (
        <div className="space-y-2">
          {queue.filter((q) => q.status !== "done" && q.status !== "paid").map((q) => (
            <div key={q.id} className="flex items-center justify-between rounded-xl border border-slate-700/20 bg-slate-800/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-200">{String(q.queue_number).padStart(3, "0")}</span>
                <span className="text-sm text-slate-300">{q.patients?.name || "Pasien"}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${q.status === "serving" ? "bg-sky-900/40 text-sky-300" : q.status === "called" ? "bg-amber-900/40 text-amber-300" : "bg-slate-700/40 text-slate-400"}`}>
                {q.status === "serving" ? "Dilayani" : q.status === "called" ? "Dipanggil" : "Menunggu"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CounterQueueWrapper() {
  return <SubQueueView title="Antrian Loket" icon="🎫" type="loket" />
}

export function PharmacyQueueWrapper() {
  return <SubQueueView title="Antrian Apotek" icon="💊" type="apotek" />
}

// ─────────────────────────────────────────────────────────────────────────────
// E-RESEP
// ─────────────────────────────────────────────────────────────────────────────
type Patient = { id: string; name: string; phone?: string }
type Doctor = { id: string; name: string; specialization?: string }
type StockItem = { id: string; name: string; unit: string }
type RxItem = { name: string; dose: string; frequency: string; duration: string; notes: string }
type MedRecord = {
  id: string
  visit_date: string
  chief_complaint: string | null
  diagnosis: string | null
  treatment: string | null
  prescription: string | null
  prescription_items: RxItem[] | null
  dispensed: boolean
  dispensed_at: string | null
  notes: string | null
  patients: { name: string; phone?: string } | null
  doctors: { name: string; specialization?: string } | null
}

const emptyRxItem = (): RxItem => ({ name: "", dose: "", frequency: "", duration: "", notes: "" })
const emptyRxForm = {
  patient_id: "", doctor_id: "",
  visit_date: new Date().toISOString().slice(0, 10),
  diagnosis: "", treatment: "",
}

function rxItemsToText(items: RxItem[]): string {
  return items
    .filter((i) => i.name.trim())
    .map((i, idx) => {
      const parts = [i.dose, i.frequency, i.duration].filter(Boolean).join(" · ")
      const notes = i.notes ? ` (${i.notes})` : ""
      return `${idx + 1}. ${i.name}${parts ? `  ${parts}` : ""}${notes}`
    })
    .join("\n")
}

export function PrescriptionWrapper() {
  const [planCode, setPlanCode] = useState<PlanCode | null>(null)
  const [planChecked, setPlanChecked] = useState(false)
  const [records, setRecords] = useState<MedRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dispensingId, setDispensingId] = useState<string | null>(null)
  const [sendingWaId, setSendingWaId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [filterPatient, setFilterPatient] = useState("")
  const [detail, setDetail] = useState<MedRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyRxForm)
  const [rxItems, setRxItems] = useState<RxItem[]>([emptyRxItem()])
  const [suggestions, setSuggestions] = useState<string[][]>([[]])

  useEffect(() => {
    const checkPlan = async () => {
      const token = await getToken()
      const res = await fetch("/api/subscription", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setPlanCode((data.subscription?.plan?.code as PlanCode) ?? null)
      setPlanChecked(true)
    }
    checkPlan()
  }, [])

  const loadData = useCallback(async (patId?: string) => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [recRes, bookRes, stockRes] = await Promise.all([
        fetch(`/api/medical-records${patId ? `?patient_id=${patId}` : ""}`, { headers }),
        fetch("/api/bookings", { headers }),
        fetch("/api/stock", { headers }),
      ])
      const [recData, bookData, stockData] = await Promise.all([recRes.json(), bookRes.json(), stockRes.json()])
      if (!recRes.ok) throw new Error(recData.error)
      setRecords((recData.records as MedRecord[]).filter((r) => r.prescription?.trim() || (r.prescription_items?.length ?? 0) > 0))
      if (bookData.success) { setPatients(bookData.patients ?? []); setDoctors(bookData.doctors ?? []) }
      if (stockData.success) setStockItems(stockData.items ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleFilter = (patId: string) => { setFilterPatient(patId); loadData(patId || undefined) }

  const updateItem = (idx: number, field: keyof RxItem, value: string) => {
    setRxItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
    if (field === "name") {
      const q = value.toLowerCase()
      setSuggestions((prev) => prev.map((s, i) =>
        i === idx ? (q.length < 2 ? [] : stockItems.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6).map((s) => s.name)) : s
      ))
    }
  }

  const pickSuggestion = (idx: number, name: string) => {
    setRxItems((prev) => prev.map((item, i) => i === idx ? { ...item, name } : item))
    setSuggestions((prev) => prev.map((_, i) => i === idx ? [] : _))
  }

  const addItem = () => {
    setRxItems((prev) => [...prev, emptyRxItem()])
    setSuggestions((prev) => [...prev, []])
  }

  const removeItem = (idx: number) => {
    setRxItems((prev) => prev.filter((_, i) => i !== idx))
    setSuggestions((prev) => prev.filter((_, i) => i !== idx))
  }

  const openForm = () => {
    setShowForm(true); setError(""); setDetail(null)
    setRxItems([emptyRxItem()]); setSuggestions([[]]); setForm(emptyRxForm)
  }

  const handleSave = async () => {
    const validItems = rxItems.filter((i) => i.name.trim())
    if (!form.patient_id || !form.doctor_id || !form.visit_date || validItems.length === 0) {
      setError("Pasien, dokter, tanggal, dan minimal 1 obat wajib diisi")
      return
    }
    setSaving(true); setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, prescription_items: validItems, prescription: rxItemsToText(validItems) }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setShowForm(false)
      loadData(filterPatient || undefined)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally { setSaving(false) }
  }

  const handleDispense = async (record: MedRecord) => {
    setDispensingId(record.id)
    try {
      const token = await getToken()
      const res = await fetch("/api/medical-records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: record.id, dispensed: !record.dispensed }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setRecords((prev) => prev.map((r) => r.id === record.id ? { ...r, dispensed: !r.dispensed, dispensed_at: data.record.dispensed_at } : r))
      if (detail?.id === record.id) setDetail((prev) => prev ? { ...prev, dispensed: !prev.dispensed, dispensed_at: data.record.dispensed_at } : prev)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal update status")
    } finally { setDispensingId(null) }
  }

  const handleSendWA = async (record: MedRecord) => {
    const phone = record.patients?.phone
    if (!phone) { setError("Nomor HP pasien tidak tersedia"); return }
    setSendingWaId(record.id)
    const items = (record.prescription_items?.length ?? 0) > 0
      ? record.prescription_items!.filter((i) => i.name).map((i, idx) => {
          const parts = [i.dose, i.frequency, i.duration].filter(Boolean).join(" · ")
          return `${idx + 1}. *${i.name}*${parts ? `  ${parts}` : ""}${i.notes ? ` _(${i.notes})_` : ""}`
        }).join("\n")
      : record.prescription ?? "-"
    const msg = `*Resep Obat Digital* 💊\n\nPasien: ${record.patients?.name ?? "-"}\nDokter: ${record.doctors?.name ?? "-"}\nTanggal: ${record.visit_date}\n${record.diagnosis ? `Diagnosa: ${record.diagnosis}\n` : ""}\n*Daftar Obat:*\n${items}\n\n_Minum obat sesuai petunjuk dokter. Hubungi klinik jika ada pertanyaan._`
    try {
      const token = await getToken()
      const res = await fetch("/api/wa/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone, message: msg }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? "Gagal kirim WA")
      setError("")
      alert("Resep berhasil dikirim via WhatsApp!")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal kirim WA")
    } finally { setSendingWaId(null) }
  }

  const printRecord = (r: MedRecord) => {
    setDetail(r)
    setTimeout(() => window.print(), 150)
  }

  if (!planChecked) {
    return <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" /></div>
  }

  if (!hasPlanFeature(planCode ?? undefined, "inventory_management")) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">E-Resep</h1>
        </div>
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 to-slate-900/20 p-10 text-center shadow-lg">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/20">
            <span className="text-4xl">💊</span>
          </div>
          <h2 className="mb-3 text-xl font-bold text-white">E-Resep Digital</h2>
          <p className="mx-auto mb-2 max-w-md text-slate-400">
            Fitur ini tersedia mulai paket <span className="font-semibold text-white">Profesional</span>.
          </p>
          <p className="mx-auto mb-8 max-w-md text-sm text-slate-500">
            Tulis resep terstruktur, autocomplete dari stok obat, cetak resep profesional, kirim via WhatsApp, dan lacak status ditebus.
          </p>
          <a href="/billing" className="inline-block rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition">
            Upgrade ke Paket Profesional →
          </a>
          <p className="mt-4 text-xs text-slate-500">Paket saat ini: <span className="capitalize text-slate-300">{planCode ?? "trial"}</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; color: black !important; }
          .print-rx { background: white; color: black; padding: 32px; font-family: serif; }
          .print-rx h1 { font-size: 18px; font-weight: bold; }
          .print-rx .rx-items { border: 1px solid #000; padding: 12px; margin: 12px 0; border-radius: 4px; }
          .print-rx .sig { margin-top: 40px; text-align: right; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Print Template */}
      {detail && (
        <div className="print-only print-rx">
          <div style={{ borderBottom: "2px solid #000", paddingBottom: 8, marginBottom: 12 }}>
            <h1>Resep Dokter</h1>
            <p style={{ fontSize: 13 }}>Tanggal: {detail.visit_date}</p>
          </div>
          <div style={{ display: "flex", gap: 32, fontSize: 13, marginBottom: 12 }}>
            <div><b>Pasien:</b> {detail.patients?.name ?? "—"}<br/><b>Dokter:</b> {detail.doctors?.name ?? "—"}{detail.doctors?.specialization ? ` (${detail.doctors.specialization})` : ""}</div>
          </div>
          {detail.diagnosis && <p style={{ fontSize: 13, marginBottom: 8 }}><b>Diagnosa:</b> {detail.diagnosis}</p>}
          <div className="rx-items">
            <p style={{ fontWeight: "bold", marginBottom: 6 }}>R/</p>
            {(detail.prescription_items?.length ?? 0) > 0
              ? detail.prescription_items!.filter((i) => i.name).map((item, idx) => (
                  <p key={idx} style={{ marginBottom: 4, fontSize: 13 }}>
                    {idx + 1}. <b>{item.name}</b> {item.dose} — {item.frequency}{item.duration ? ` selama ${item.duration}` : ""}{item.notes ? ` (${item.notes})` : ""}
                  </p>
                ))
              : <pre style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{detail.prescription}</pre>
            }
          </div>
          <div className="sig">
            <p style={{ fontSize: 13 }}>Hormat,</p>
            <div style={{ height: 48 }} />
            <p style={{ fontSize: 13, borderTop: "1px solid #000", paddingTop: 4 }}>{detail.doctors?.name ?? "Dokter"}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">E-Resep</h1>
        </div>
        <button onClick={openForm} className="btn-primary text-sm">+ Tulis Resep Baru</button>
      </div>

      {error && <div className="no-print rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      {/* Filter */}
      <div className="no-print">
        <select value={filterPatient} onChange={(e) => handleFilter(e.target.value)} className="input max-w-xs">
          <option value="">Semua Pasien</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="no-print rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Tulis Resep Baru</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Pasien</label>
              <select value={form.patient_id} onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))} className="input">
                <option value="">Pilih Pasien</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dokter</label>
              <select value={form.doctor_id} onChange={(e) => setForm((p) => ({ ...p, doctor_id: e.target.value }))} className="input">
                <option value="">Pilih Dokter</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tanggal</label>
              <input type="date" value={form.visit_date} onChange={(e) => setForm((p) => ({ ...p, visit_date: e.target.value }))} className="input" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Diagnosis</label>
              <textarea value={form.diagnosis} onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} rows={2} className="input resize-none" placeholder="Diagnosis dokter..." />
            </div>
            <div>
              <label className="label">Tindakan</label>
              <textarea value={form.treatment} onChange={(e) => setForm((p) => ({ ...p, treatment: e.target.value }))} rows={2} className="input resize-none" placeholder="Tindakan yang dilakukan..." />
            </div>
          </div>

          {/* Structured Rx Items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Daftar Obat</label>
              <button onClick={addItem} className="text-xs text-indigo-400 hover:text-indigo-300">+ Tambah Obat</button>
            </div>
            <div className="space-y-3">
              {rxItems.map((item, idx) => (
                <div key={idx} className="relative rounded-2xl border border-slate-700/30 bg-slate-900/30 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400">Obat {idx + 1}</span>
                    {rxItems.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-xs text-rose-400 hover:text-rose-300">Hapus</button>
                    )}
                  </div>
                  <div className="grid gap-2 md:grid-cols-5">
                    {/* Name with autocomplete */}
                    <div className="relative md:col-span-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                        onBlur={() => setTimeout(() => setSuggestions((prev) => prev.map((s, i) => i === idx ? [] : s)), 150)}
                        className="input"
                        placeholder="Nama obat..."
                      />
                      {suggestions[idx]?.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-700/50 bg-slate-800 shadow-xl">
                          {suggestions[idx].map((s) => (
                            <button key={s} onMouseDown={() => pickSuggestion(idx, s)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700/50 first:rounded-t-xl last:rounded-b-xl">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input type="text" value={item.dose} onChange={(e) => updateItem(idx, "dose", e.target.value)} className="input" placeholder="Dosis (500mg)" />
                    <input type="text" value={item.frequency} onChange={(e) => updateItem(idx, "frequency", e.target.value)} className="input" placeholder="Frekuensi (3x1)" />
                    <input type="text" value={item.duration} onChange={(e) => updateItem(idx, "duration", e.target.value)} className="input" placeholder="Durasi (7 hari)" />
                  </div>
                  <div className="mt-2">
                    <input type="text" value={item.notes} onChange={(e) => updateItem(idx, "notes", e.target.value)} className="input" placeholder="Catatan (setelah makan, bila perlu...)" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? "Menyimpan..." : "Simpan Resep"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {detail && (
        <div className="no-print rounded-3xl border border-slate-700/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Detail Resep</h2>
            <div className="flex gap-2">
              <button onClick={() => printRecord(detail)}
                className="rounded-xl border border-slate-600/30 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50">
                🖨 Cetak
              </button>
              <button
                onClick={() => handleSendWA(detail)}
                disabled={sendingWaId === detail.id || !detail.patients?.phone}
                className="rounded-xl border border-emerald-700/30 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-900/40 disabled:opacity-40">
                {sendingWaId === detail.id ? "Mengirim..." : "📲 Kirim WA"}
              </button>
              <button
                onClick={() => handleDispense(detail)}
                disabled={dispensingId === detail.id}
                className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                  detail.dispensed
                    ? "border-indigo-700/30 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40"
                    : "border-amber-700/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40"
                }`}>
                {dispensingId === detail.id ? "..." : detail.dispensed ? "✓ Sudah Ditebus" : "Tandai Ditebus"}
              </button>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-3">
            <p><span className="text-slate-400">Pasien:</span> <span className="text-white font-medium">{detail.patients?.name ?? "—"}</span></p>
            <p><span className="text-slate-400">Dokter:</span> <span className="text-white">{detail.doctors?.name ?? "—"}</span></p>
            <p><span className="text-slate-400">Tanggal:</span> <span className="text-white">{detail.visit_date}</span></p>
          </div>

          {detail.diagnosis && <div><p className="text-xs text-slate-400 mb-1">Diagnosis</p><p className="text-white text-sm">{detail.diagnosis}</p></div>}

          <div>
            <p className="text-xs text-slate-400 mb-2">Daftar Obat</p>
            {(detail.prescription_items?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                {detail.prescription_items!.filter((i) => i.name).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-xl border border-slate-700/20 bg-slate-900/30 px-4 py-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-300">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{[item.dose, item.frequency, item.duration].filter(Boolean).join(" · ")}{item.notes ? ` — ${item.notes}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="rounded-2xl bg-slate-900/60 border border-slate-700/20 p-4 text-sm text-indigo-100 whitespace-pre-wrap font-mono">{detail.prescription}</pre>
            )}
          </div>

          {detail.dispensed && detail.dispensed_at && (
            <p className="text-xs text-emerald-400">✓ Ditebus pada {new Date(detail.dispensed_at).toLocaleString("id-ID")}</p>
          )}
        </div>
      )}

      {/* List */}
      <div className="no-print rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 px-5 py-4">
          <h2 className="font-semibold text-white">Daftar E-Resep</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
        ) : records.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
            <span className="text-2xl opacity-30">💊</span>
            <p className="text-sm text-slate-500">Belum ada resep. Klik &quot;Tulis Resep Baru&quot; untuk memulai.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/10">
            {records.map((r) => (
              <button key={r.id} onClick={() => { setDetail(r); setShowForm(false) }}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-800/20 transition">
                <div className="min-w-0">
                  <p className="font-medium text-white">{r.patients?.name ?? "—"}</p>
                  <p className="text-xs text-slate-500">{r.doctors?.name} · {r.visit_date}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.dispensed ? "bg-emerald-900/40 text-emerald-300" : "bg-amber-900/40 text-amber-300"}`}>
                    {r.dispensed ? "Ditebus" : "Belum Ditebus"}
                  </span>
                  <span className="text-xs text-slate-500">{(r.prescription_items?.filter(i => i.name).length ?? 0)} obat</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RAWAT JALAN / POLIKLINIK
// ─────────────────────────────────────────────────────────────────────────────
type Booking = {
  id: string
  visit_date: string
  payment_status: string
  patients: { id: string; name: string } | null
  doctors: { id: string; name: string } | null
}
export function OutpatientPolyclinicWrapper() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [filterDoctor, setFilterDoctor] = useState("")
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [bookRes, queueRes] = await Promise.all([
        fetch("/api/bookings", { headers }),
        fetch(`/api/queue?type=poli&date=${date}`, { headers }),
      ])
      const [bookData, queueData] = await Promise.all([bookRes.json(), queueRes.json()])
      if (!bookRes.ok) throw new Error(bookData.error)
      setDoctors(bookData.doctors ?? [])
      setBookings(bookData.bookings ?? [])
      if (queueData.success) setQueue(queueData.queue ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { loadAll() }, [loadAll])

  // Bookings filtered by date and optionally by doctor
  const todayBookings = bookings.filter((b) => {
    const matchDate = b.visit_date === date
    const matchDoctor = !filterDoctor || b.doctors?.id === filterDoctor
    return matchDate && matchDoctor
  })

  const getQueueEntry = (booking: Booking) =>
    queue.find((q) => q.patient_id === booking.patients?.id && (q.doctor_id === booking.doctors?.id || !q.doctor_id))

  const handleCallPatient = async (booking: Booking) => {
    const entry = getQueueEntry(booking)
    if (!entry) return
    setUpdatingId(entry.id)
    try {
      const token = await getToken()
      await fetch("/api/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: entry.id, status: "called" }),
      })
      setQueue((prev) => prev.map((q) => q.id === entry.id ? { ...q, status: "called" } : q))
    } catch {
      // silent
    } finally {
      setUpdatingId(null)
    }
  }

  const statusLabel = (status: string) => {
    if (status === "waiting") return { label: "Menunggu", cls: "bg-amber-500/10 text-amber-300" }
    if (status === "called") return { label: "Dipanggil", cls: "bg-blue-500/10 text-blue-300" }
    if (status === "serving") return { label: "Dilayani", cls: "bg-indigo-500/10 text-indigo-300" }
    if (status === "done") return { label: "Selesai", cls: "bg-emerald-500/10 text-emerald-300" }
    return { label: "Belum Hadir", cls: "bg-slate-700/20 text-slate-400" }
  }

  const total = todayBookings.length
  const done = todayBookings.filter((b) => {
    const q = getQueueEntry(b)
    return q?.status === "done"
  }).length
  const waiting = total - done

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Rawat Jalan / Poliklinik</h1>
        </div>
        <button onClick={loadAll} className="btn-secondary text-sm">Refresh</button>
      </div>

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-sm text-slate-400">Total Pasien</p>
          <p className="mt-2 text-3xl font-bold text-white">{total}</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-sm text-slate-400">Sudah Dilayani</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{done}</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-5">
          <p className="text-sm text-slate-400">Menunggu</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">{waiting}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className="input">
          <option value="">Semua Dokter</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
        <div className="border-b border-slate-700/20 p-5">
          <h2 className="font-semibold text-white">Pasien Hari Ini — {date}</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
        ) : todayBookings.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada booking pada tanggal ini</div>
        ) : (
          <div className="divide-y divide-slate-700/10">
            {todayBookings.map((b, idx) => {
              const entry = getQueueEntry(b)
              const { label, cls } = entry ? statusLabel(entry.status) : { label: "Belum Antri", cls: "bg-slate-700/20 text-slate-400" }
              const canCall = entry && entry.status === "waiting"
              return (
                <div key={b.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-slate-500 w-8">{idx + 1}</span>
                    <div>
                      <p className="font-medium text-white">{b.patients?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{b.doctors?.name ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>
                    {canCall && (
                      <button
                        onClick={() => handleCallPatient(b)}
                        disabled={updatingId === entry?.id}
                        className="rounded-xl border border-indigo-700/30 bg-indigo-950/30 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-900/40 disabled:opacity-50"
                      >
                        Panggil
                      </button>
                    )}
                    <a
                      href={`/pelayanan/rekam-medis-elektronik`}
                      className="rounded-xl border border-slate-700/30 bg-slate-800/30 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/30"
                    >
                      Buka RM
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LABORATORIUM
// ─────────────────────────────────────────────────────────────────────────────
type LabRequest = {
  id: string
  request_date: string
  test_types: string[]
  status: string
  notes: string | null
  result: string | null
  patients: { name: string } | null
  doctors: { name: string } | null
}

const LAB_TESTS = [
  "Darah Lengkap",
  "Urine Lengkap",
  "Gula Darah",
  "Kolesterol Total",
  "Asam Urat",
  "SGOT/SGPT",
  "Kreatinin",
  "Thyroid (TSH)",
]

const emptyLabForm = {
  patient_id: "", doctor_id: "",
  request_date: new Date().toISOString().slice(0, 10),
  test_types: [] as string[],
  notes: "",
}

export function LaboratoryWrapper() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [requests, setRequests] = useState<LabRequest[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tableNotFound, setTableNotFound] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyLabForm)
  const [detail, setDetail] = useState<LabRequest | null>(null)
  const [resultInput, setResultInput] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [labRes, bookRes] = await Promise.all([
        fetch(`/api/lab?date=${date}`, { headers }),
        fetch("/api/bookings", { headers }),
      ])
      const [labData, bookData] = await Promise.all([labRes.json(), bookRes.json()])
      if (labData.tableNotFound) {
        setTableNotFound(true)
        return
      }
      if (!labRes.ok) throw new Error(labData.error)
      setTableNotFound(false)
      setRequests(labData.requests ?? [])
      if (bookData.success) {
        setPatients(bookData.patients ?? [])
        setDoctors(bookData.doctors ?? [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { loadRequests() }, [loadRequests])

  const toggleTest = (test: string) => {
    setForm((prev) => ({
      ...prev,
      test_types: prev.test_types.includes(test)
        ? prev.test_types.filter((t) => t !== test)
        : [...prev.test_types, test],
    }))
  }

  const handleSave = async () => {
    if (!form.patient_id || form.test_types.length === 0) {
      setError("Pasien dan jenis pemeriksaan wajib diisi")
      return
    }
    setSaving(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.tableNotFound) { setTableNotFound(true); return }
      if (!res.ok || !data.success) throw new Error(data.error)
      setShowForm(false)
      setForm(emptyLabForm)
      loadRequests()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const token = await getToken()
      await fetch("/api/lab", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      })
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
      if (detail?.id === id) setDetail((prev) => prev ? { ...prev, status } : null)
    } catch {
      // silent
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSaveResult = async () => {
    if (!detail) return
    setUpdatingId(detail.id)
    try {
      const token = await getToken()
      await fetch("/api/lab", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: detail.id, result: resultInput, status: "selesai" }),
      })
      setRequests((prev) => prev.map((r) => r.id === detail.id ? { ...r, result: resultInput, status: "selesai" } : r))
      setDetail((prev) => prev ? { ...prev, result: resultInput, status: "selesai" } : null)
    } catch {
      // silent
    } finally {
      setUpdatingId(null)
    }
  }

  const statusBadge = (status: string) => {
    if (status === "selesai") return "bg-emerald-500/10 text-emerald-300"
    if (status === "proses") return "bg-blue-500/10 text-blue-300"
    return "bg-amber-500/10 text-amber-300"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pelayanan</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Laboratorium</h1>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); setDetail(null) }}
          disabled={tableNotFound}
          className="btn-primary text-sm disabled:opacity-50"
        >
          + Permintaan Lab Baru
        </button>
      </div>

      {tableNotFound && (
        <div className="rounded-2xl border border-amber-700/30 bg-amber-950/20 p-4 text-sm text-amber-300">
          Tabel <code>lab_requests</code> belum ada. Jalankan <strong>full_setup.sql</strong> di Supabase terlebih dahulu, lalu muat ulang halaman ini.
        </div>
      )}

      {error && <div className="rounded-2xl border border-red-700/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      {!tableNotFound && (
        <div className="flex gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
      )}

      {showForm && !tableNotFound && (
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Permintaan Lab Baru</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Pasien</label>
              <select value={form.patient_id} onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))} className="input">
                <option value="">Pilih Pasien</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dokter (opsional)</label>
              <select value={form.doctor_id} onChange={(e) => setForm((p) => ({ ...p, doctor_id: e.target.value }))} className="input">
                <option value="">Pilih Dokter</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tanggal</label>
              <input type="date" value={form.request_date} onChange={(e) => setForm((p) => ({ ...p, request_date: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label mb-2 block">Jenis Pemeriksaan</label>
            <div className="flex flex-wrap gap-2">
              {LAB_TESTS.map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer rounded-xl border border-slate-700/30 bg-slate-800/30 px-3 py-2 text-sm text-slate-300 hover:border-indigo-500/40">
                  <input
                    type="checkbox"
                    checked={form.test_types.includes(t)}
                    onChange={() => toggleTest(t)}
                    className="accent-indigo-500"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Catatan</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="input resize-none"
              placeholder="Catatan tambahan..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? "Menyimpan..." : "Simpan Permintaan"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      {detail && (
        <div className="rounded-3xl border border-slate-700/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Detail Pemeriksaan Lab</h2>
            <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <p><span className="text-slate-400">Pasien:</span> <span className="text-white font-medium">{detail.patients?.name ?? "—"}</span></p>
            <p><span className="text-slate-400">Dokter:</span> <span className="text-white">{detail.doctors?.name ?? "—"}</span></p>
            <p><span className="text-slate-400">Tanggal:</span> <span className="text-white">{detail.request_date}</span></p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">Jenis Pemeriksaan</p>
            <div className="flex flex-wrap gap-2">
              {detail.test_types.map((t) => (
                <span key={t} className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">{t}</span>
              ))}
            </div>
          </div>
          {detail.notes && <div><p className="text-xs text-slate-400 mb-1">Catatan</p><p className="text-sm text-white">{detail.notes}</p></div>}
          <div>
            <label className="label">Hasil Pemeriksaan</label>
            <textarea
              value={resultInput}
              onChange={(e) => setResultInput(e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="Masukkan hasil pemeriksaan lab..."
              defaultValue={detail.result ?? ""}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveResult}
              disabled={updatingId === detail.id}
              className="btn-primary text-sm"
            >
              {updatingId === detail.id ? "Menyimpan..." : "Simpan Hasil"}
            </button>
          </div>
        </div>
      )}

      {!tableNotFound && (
        <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 overflow-hidden">
          <div className="border-b border-slate-700/20 p-5">
            <h2 className="font-semibold text-white">Daftar Permintaan Lab — {date}</h2>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center text-slate-400 text-sm">Memuat data...</div>
          ) : requests.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Belum ada permintaan lab pada tanggal ini</div>
          ) : (
            <div className="divide-y divide-slate-700/10">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <button
                    onClick={() => { setDetail(r); setResultInput(r.result ?? ""); setShowForm(false) }}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-white">{r.patients?.name ?? "—"}</p>
                    <p className="text-xs text-slate-500">{r.test_types.join(", ")}</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(r.status)}`}>
                      {r.status === "selesai" ? "Selesai" : r.status === "proses" ? "Proses" : "Pending"}
                    </span>
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, "proses")}
                        disabled={updatingId === r.id}
                        className="rounded-xl border border-blue-700/30 bg-blue-950/30 px-2 py-1 text-xs text-blue-300 hover:bg-blue-900/40 disabled:opacity-50"
                      >
                        Proses
                      </button>
                    )}
                    {r.status === "proses" && (
                      <button
                        onClick={() => { setDetail(r); setResultInput(r.result ?? ""); setShowForm(false) }}
                        className="rounded-xl border border-emerald-700/30 bg-emerald-950/30 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-900/40"
                      >
                        Input Hasil
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
