"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

const currency = new Intl.NumberFormat("id-ID")

const FREQ_LABELS: Record<string, string> = {
  weekly: "Setiap Minggu",
  biweekly: "Setiap 2 Minggu",
  monthly: "Setiap Bulan",
}

type Patient = { id: string; name: string; phone?: string }
type Doctor = { id: string; name: string; specialization?: string }

type RecurringPlan = {
  id: string
  name: string
  amount: number
  frequency: string
  day_of_week?: number | null
  day_of_month?: number | null
  visit_type: string
  notes?: string | null
  is_active: boolean
  next_due_date?: string | null
  last_generated_at?: string | null
  created_at: string
  patients?: Patient | null
  doctors?: Doctor | null
}

type HistoryBooking = {
  id: string
  visit_date: string
  price: number
  payment_status: string
  notes?: string | null
  patients?: { name?: string } | null
  doctors?: { name?: string } | null
}

type RecurringResponse = {
  success?: boolean
  error?: string
  plans?: RecurringPlan[]
  due_today?: RecurringPlan[]
}

type HistoryResponse = {
  success?: boolean
  bookings?: HistoryBooking[]
}

type GenerateResponse = {
  success?: boolean
  error?: string
  generated?: number
  bookings?: unknown[]
}

const emptyForm = {
  patient_id: "",
  doctor_id: "",
  name: "",
  amount: "",
  frequency: "weekly",
  day_of_week: "",
  day_of_month: "",
  visit_type: "regular",
  notes: "",
  next_due_date: "",
}

export default function TagihanRecurringPage() {
  const [token, setToken] = useState<string | null>(null)
  const [plans, setPlans] = useState<RecurringPlan[]>([])
  const [dueToday, setDueToday] = useState<RecurringPlan[]>([])
  const [history, setHistory] = useState<HistoryBooking[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editPlan, setEditPlan] = useState<RecurringPlan | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [])

  const fetchAll = useCallback(async (tok: string) => {
    setLoading(true)
    try {
      const [recurringRes, bookingsRes] = await Promise.all([
        fetch("/api/recurring", { headers: { Authorization: `Bearer ${tok}` } }),
        fetch("/api/bookings", { headers: { Authorization: `Bearer ${tok}` } }),
      ])

      const recurringData = (await recurringRes.json()) as RecurringResponse
      const bookData = (await bookingsRes.json()) as HistoryResponse & { patients?: Patient[]; doctors?: Doctor[] }

      if (recurringData.success) {
        setPlans(recurringData.plans || [])
        setDueToday(recurringData.due_today || [])
      }

      // Filter bookings for auto-generated ones
      const allBookings = bookData.bookings || []
      const autoBookings = allBookings
        .filter((b) => typeof b.notes === "string" && b.notes.startsWith("[Auto]"))
        .slice(0, 20)
      setHistory(autoBookings)

      setPatients(bookData.patients || [])
      setDoctors(bookData.doctors || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getToken().then((tok) => {
      if (tok) {
        setToken(tok)
        void fetchAll(tok)
      }
    })
  }, [getToken, fetchAll])

  const generateAll = async () => {
    if (!token) return
    setGenerating(true)
    try {
      const res = await fetch("/api/recurring/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as GenerateResponse
      if (data.success) {
        setMsg({ type: "ok", text: `Berhasil generate ${data.generated ?? 0} tagihan.` })
        void fetchAll(token)
      } else {
        setMsg({ type: "err", text: data.error || "Gagal generate" })
      }
    } finally {
      setGenerating(false)
    }
  }

  const generateOne = async (planId: string) => {
    if (!token) return
    // Temporarily set that plan's next_due_date = today for targeted generate
    // We patch it locally, then call generate
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return

    // Force update next_due_date to today so generate picks it up
    const today = new Date().toISOString().slice(0, 10)
    const patchRes = await fetch("/api/recurring", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: planId, next_due_date: today }),
    })
    if (!patchRes.ok) {
      setMsg({ type: "err", text: "Gagal menyiapkan generate manual" })
      return
    }

    const genRes = await fetch("/api/recurring/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = (await genRes.json()) as GenerateResponse
    if (data.success) {
      setMsg({ type: "ok", text: `Tagihan untuk "${plan.name}" berhasil di-generate.` })
      void fetchAll(token)
    } else {
      setMsg({ type: "err", text: data.error || "Gagal generate" })
    }
  }

  const toggleActive = async (plan: RecurringPlan) => {
    if (!token) return
    const res = await fetch("/api/recurring", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: plan.id, is_active: !plan.is_active }),
    })
    const data = await res.json() as { success?: boolean; error?: string }
    if (data.success) {
      void fetchAll(token)
    } else {
      setMsg({ type: "err", text: data.error || "Gagal update status" })
    }
  }

  const deletePlan = async (id: string) => {
    if (!token) return
    if (!confirm("Hapus plan ini?")) return
    const res = await fetch(`/api/recurring?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json() as { success?: boolean; error?: string }
    if (data.success) {
      setMsg({ type: "ok", text: "Plan berhasil dihapus." })
      void fetchAll(token)
    } else {
      setMsg({ type: "err", text: data.error || "Gagal hapus" })
    }
  }

  const openAddForm = () => {
    setEditPlan(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEditForm = (plan: RecurringPlan) => {
    setEditPlan(plan)
    setForm({
      patient_id: plan.patients?.id || "",
      doctor_id: plan.doctors?.id || "",
      name: plan.name,
      amount: String(plan.amount),
      frequency: plan.frequency,
      day_of_week: plan.day_of_week != null ? String(plan.day_of_week) : "",
      day_of_month: plan.day_of_month != null ? String(plan.day_of_month) : "",
      visit_type: plan.visit_type,
      notes: plan.notes || "",
      next_due_date: plan.next_due_date || "",
    })
    setShowForm(true)
  }

  const saveForm = async () => {
    if (!token) return
    setSaving(true)
    try {
      const payload = {
        patient_id: form.patient_id,
        doctor_id: form.doctor_id || undefined,
        name: form.name,
        amount: Number(form.amount),
        frequency: form.frequency,
        day_of_week: form.day_of_week !== "" ? Number(form.day_of_week) : null,
        day_of_month: form.day_of_month !== "" ? Number(form.day_of_month) : null,
        visit_type: form.visit_type,
        notes: form.notes || null,
        next_due_date: form.next_due_date || null,
      }

      const res = await fetch("/api/recurring", {
        method: editPlan ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(editPlan ? { id: editPlan.id, ...payload } : payload),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (data.success) {
        setMsg({ type: "ok", text: editPlan ? "Plan diperbarui." : "Plan baru ditambahkan." })
        setShowForm(false)
        void fetchAll(token)
      } else {
        setMsg({ type: "err", text: data.error || "Gagal menyimpan" })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin w-12 h-12 rounded-full border-4 border-slate-700 border-t-indigo-500"></div>
          <p className="text-slate-400">Memuat tagihan berulang...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-700/20 pb-5">
        <h1 className="text-2xl font-bold text-white">Tagihan Berulang</h1>
        <p className="mt-1 text-sm text-slate-400">Kelola tagihan otomatis untuk pasien rawat jalan rutin (cuci darah, fisioterapi, kemoterapi, kontrol).</p>
      </div>

      {/* Alert message */}
      {msg && (
        <div className={`rounded-3xl border px-5 py-4 text-sm font-semibold ${msg.type === "ok" ? "border-emerald-600/30 bg-emerald-950/20 text-emerald-300" : "border-rose-600/30 bg-rose-950/20 text-rose-300"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Section 1: Jatuh Tempo Hari Ini */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-slate-900/20 p-5 shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="font-bold text-white text-lg">Jatuh Tempo Hari Ini</h2>
            {dueToday.length === 0
              ? <p className="text-sm text-slate-400 mt-1">Tidak ada tagihan yang jatuh tempo hari ini.</p>
              : <p className="text-sm text-amber-300 mt-1">{dueToday.length} tagihan perlu di-generate sekarang.</p>
            }
          </div>
          {dueToday.length > 0 && (
            <button
              onClick={generateAll}
              disabled={generating}
              className="btn-primary shrink-0"
            >
              {generating ? "Memproses..." : `Generate Semua (${dueToday.length})`}
            </button>
          )}
        </div>

        {dueToday.length > 0 && (
          <div className="space-y-2">
            {dueToday.map((plan) => (
              <div key={plan.id} className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-slate-900/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{plan.patients?.name ?? "—"}</p>
                  <p className="text-sm text-slate-400 truncate">{plan.name} · {plan.doctors?.name ?? "Tanpa Dokter"}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-emerald-300 font-semibold text-sm">Rp {currency.format(plan.amount)}</span>
                  <button
                    onClick={() => generateOne(plan.id)}
                    className="btn-secondary text-xs"
                  >
                    Generate Manual
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Semua Recurring Plans */}
      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-5 shadow-md">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="font-bold text-white text-lg">Semua Recurring Plans</h2>
          <button onClick={openAddForm} className="btn-primary">+ Tambah Plan Baru</button>
        </div>

        {/* Form Add/Edit */}
        {showForm && (
          <div className="mb-5 rounded-3xl border border-indigo-500/20 bg-slate-900/40 p-5 space-y-4">
            <h3 className="font-bold text-white">{editPlan ? "Edit Plan" : "Tambah Plan Baru"}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label-text">Pasien *</label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  className="input-field mt-1"
                >
                  <option value="">-- Pilih Pasien --</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Dokter</label>
                <select
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                  className="input-field mt-1"
                >
                  <option value="">-- Tanpa Dokter --</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Nama Layanan *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="cth: Cuci Darah Mingguan"
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="label-text">Jumlah Tagihan (Rp) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="250000"
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="label-text">Frekuensi *</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="input-field mt-1"
                >
                  <option value="weekly">Setiap Minggu</option>
                  <option value="biweekly">Setiap 2 Minggu</option>
                  <option value="monthly">Setiap Bulan</option>
                </select>
              </div>
              {form.frequency === "weekly" || form.frequency === "biweekly" ? (
                <div>
                  <label className="label-text">Hari (0=Minggu … 6=Sabtu)</label>
                  <input
                    type="number"
                    min={0} max={6}
                    value={form.day_of_week}
                    onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                    placeholder="1 = Senin"
                    className="input-field mt-1"
                  />
                </div>
              ) : (
                <div>
                  <label className="label-text">Tanggal Setiap Bulan (1-28)</label>
                  <input
                    type="number"
                    min={1} max={28}
                    value={form.day_of_month}
                    onChange={(e) => setForm({ ...form, day_of_month: e.target.value })}
                    placeholder="15"
                    className="input-field mt-1"
                  />
                </div>
              )}
              <div>
                <label className="label-text">Mulai Tanggal (Jatuh Tempo Pertama)</label>
                <input
                  type="date"
                  value={form.next_due_date}
                  onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="label-text">Jenis Kunjungan</label>
                <input
                  type="text"
                  value={form.visit_type}
                  onChange={(e) => setForm({ ...form, visit_type: e.target.value })}
                  placeholder="regular"
                  className="input-field mt-1"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="label-text">Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="input-field mt-1 resize-none"
                  placeholder="Catatan opsional..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={saveForm} disabled={saving} className="btn-primary">
                {saving ? "Menyimpan..." : (editPlan ? "Simpan Perubahan" : "Tambah Plan")}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-ghost">Batal</button>
            </div>
          </div>
        )}

        {/* Plans Table */}
        {plans.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada recurring plan. Klik &quot;+ Tambah Plan Baru&quot; untuk memulai.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="pb-3 text-left text-xs font-semibold text-slate-500">Layanan</th>
                  <th className="pb-3 text-left text-xs font-semibold text-slate-500">Pasien</th>
                  <th className="pb-3 text-left text-xs font-semibold text-slate-500">Dokter</th>
                  <th className="pb-3 text-left text-xs font-semibold text-slate-500">Frekuensi</th>
                  <th className="pb-3 text-right text-xs font-semibold text-slate-500">Jumlah</th>
                  <th className="pb-3 text-left text-xs font-semibold text-slate-500">Jatuh Tempo</th>
                  <th className="pb-3 text-left text-xs font-semibold text-slate-500">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {plans.map((plan) => (
                  <tr key={plan.id} className="group">
                    <td className="py-3">
                      <p className="font-semibold text-white truncate max-w-[150px]">{plan.name}</p>
                      <p className="text-xs text-slate-500">{plan.visit_type}</p>
                    </td>
                    <td className="py-3 text-slate-300 truncate max-w-[130px]">{plan.patients?.name ?? "—"}</td>
                    <td className="py-3 text-slate-400 truncate max-w-[120px]">{plan.doctors?.name ?? "—"}</td>
                    <td className="py-3 text-slate-300">{FREQ_LABELS[plan.frequency] ?? plan.frequency}</td>
                    <td className="py-3 text-right font-semibold text-emerald-400">Rp {currency.format(plan.amount)}</td>
                    <td className="py-3 text-slate-300">{plan.next_due_date ?? "—"}</td>
                    <td className="py-3">
                      {plan.is_active
                        ? <span className="badge badge-success">Aktif</span>
                        : <span className="badge badge-warning">Nonaktif</span>
                      }
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(plan)}
                          className="text-xs text-indigo-400 hover:text-indigo-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(plan)}
                          className="text-xs text-amber-400 hover:text-amber-200 transition"
                        >
                          {plan.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          onClick={() => generateOne(plan.id)}
                          className="text-xs text-emerald-400 hover:text-emerald-200 transition"
                        >
                          Generate
                        </button>
                        <button
                          onClick={() => deletePlan(plan.id)}
                          className="text-xs text-rose-400 hover:text-rose-200 transition"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Riwayat Generate */}
      <div className="rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-5 shadow-md">
        <h2 className="font-bold text-white text-lg mb-4">Riwayat Generate (20 Terakhir)</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada tagihan yang di-generate secara otomatis.</p>
        ) : (
          <div className="space-y-2">
            {history.map((b) => (
              <div key={b.id} className="flex flex-col gap-2 rounded-2xl border border-slate-700/20 bg-slate-900/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{b.patients?.name ?? "—"}</p>
                  <p className="text-xs text-slate-400 truncate">{b.notes} · {b.doctors?.name ?? "Tanpa Dokter"}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500">{b.visit_date}</span>
                  <span className="text-sm font-semibold text-emerald-400">Rp {currency.format(b.price)}</span>
                  {b.payment_status === "paid"
                    ? <span className="badge badge-success">Lunas</span>
                    : <span className="badge badge-warning">Pending</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
