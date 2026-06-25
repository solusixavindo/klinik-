"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type ClinicSetup = {
  logoLabel: string
  name: string
  address: string
  phone: string
  whatsapp: string
  email: string
  website: string
  npwp: string
  openDays: string[]
  openTime: string
  closeTime: string
  timezone: string
  poli: string
  doctorName: string
  doctorSpecialization: string
  doctorPhone: string
}

const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
const steps = ["Profil", "Jam Operasional", "Poli", "Dokter", "Selesai"]
const storageKey = "xaviklinika-onboarding"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [form, setForm] = useState<ClinicSetup>({
    logoLabel: "",
    name: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    npwp: "",
    openDays: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    openTime: "08:00",
    closeTime: "17:00",
    timezone: "Asia/Jakarta",
    poli: "Poli Umum",
    doctorName: "",
    doctorSpecialization: "Dokter Umum",
    doctorPhone: "",
  })
  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step])

  const update = (patch: Partial<ClinicSetup>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setMessage("")
  }

  const saveCurrentStep = async () => {
    setSaving(true)
    setMessage("")

    try {
      localStorage.setItem(storageKey, JSON.stringify({ ...form, completedStep: step }))

      if (step === 0) {
        const token = (await supabase.auth.getSession()).data.session?.access_token
        if (token) {
          await fetch("/api/pengaturan", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: form.name || undefined,
              address: form.address || undefined,
              phone: form.phone || form.whatsapp || undefined,
              email: form.email || undefined,
            }),
          })
        }
      }

      if (step < steps.length - 1) setStep((current) => current + 1)
      else router.push("/dashboard")
    } catch {
      setMessage("Setup tersimpan di perangkat ini. Anda tetap bisa lanjut dan melengkapi lagi dari pengaturan.")
      if (step < steps.length - 1) setStep((current) => current + 1)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-5xl rounded-[32px] border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 md:p-8">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Setup Klinik</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Siapkan dashboard klinik Anda</h1>
            <p className="mt-2 text-sm text-slate-400">Lengkapi data inti agar dashboard production langsung rapi.</p>
          </div>
          <button type="button" onClick={() => router.push("/dashboard")} className="btn-secondary">
            Skip Setup
          </button>
        </div>

        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
            <span>Langkah {step + 1} dari {steps.length}: {steps[step]}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-800">
            <div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/45 p-5 md:p-6">
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Klinik" value={form.name} onChange={(value) => update({ name: value })} placeholder="Klinik Sehat Sentosa" />
              <Field label="Logo Klinik" value={form.logoLabel} onChange={(value) => update({ logoLabel: value })} placeholder="Sudah diupload saat register" />
              <Field label="Alamat" value={form.address} onChange={(value) => update({ address: value })} placeholder="Alamat lengkap klinik" />
              <Field label="Telepon" value={form.phone} onChange={(value) => update({ phone: value })} placeholder="021..." />
              <Field label="WhatsApp" value={form.whatsapp} onChange={(value) => update({ whatsapp: value })} placeholder="0812..." />
              <Field label="Email Klinik" value={form.email} onChange={(value) => update({ email: value })} placeholder="admin@klinik.com" />
              <Field label="Website" value={form.website} onChange={(value) => update({ website: value })} placeholder="https://klinikanda.com" />
              <Field label="NPWP (Opsional)" value={form.npwp} onChange={(value) => update({ npwp: value })} placeholder="00.000.000.0-000.000" />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-200">Hari buka</p>
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => {
                    const active = form.openDays.includes(day)
                    return (
                      <button key={day} type="button" onClick={() => update({ openDays: active ? form.openDays.filter((item) => item !== day) : [...form.openDays, day] })} className={active ? "btn-primary" : "btn-secondary"}>
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Jam Buka" value={form.openTime} onChange={(value) => update({ openTime: value })} placeholder="08:00" />
                <Field label="Jam Tutup" value={form.closeTime} onChange={(value) => update({ closeTime: value })} placeholder="17:00" />
                <Field label="Zona Waktu" value={form.timezone} onChange={(value) => update({ timezone: value })} placeholder="Asia/Jakarta" />
              </div>
            </div>
          )}

          {step === 2 && <Field label="Poli pertama" value={form.poli} onChange={(value) => update({ poli: value })} placeholder="Poli Umum" />}

          {step === 3 && (
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Nama Dokter" value={form.doctorName} onChange={(value) => update({ doctorName: value })} placeholder="dr. Maya Putri" />
              <Field label="Spesialisasi" value={form.doctorSpecialization} onChange={(value) => update({ doctorSpecialization: value })} placeholder="Dokter Umum" />
              <Field label="Nomor HP" value={form.doctorPhone} onChange={(value) => update({ doctorPhone: value })} placeholder="0812..." />
            </div>
          )}

          {step === 4 && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-3xl text-emerald-300">✓</div>
              <h2 className="text-2xl font-bold text-white">Setup awal selesai</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-400">Dashboard production akan dibuka dengan checklist quick start agar tim klinik bisa menambah data operasional pertama.</p>
            </div>
          )}
        </div>

        {message && <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">{message}</p>}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="btn-secondary disabled:opacity-40">
            Kembali
          </button>
          <button type="button" onClick={saveCurrentStep} disabled={saving} className="btn-primary">
            {saving ? "Menyimpan..." : step === steps.length - 1 ? "Masuk Dashboard" : "Simpan & Lanjut"}
          </button>
        </div>
      </section>
    </main>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-200">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="input" />
    </label>
  )
}
