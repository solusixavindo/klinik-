"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  type UserRole,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  STAFF_ROLES,
} from "@/lib/roleAccess"

type StaffMember = {
  id: string
  name: string
  email: string
  role: UserRole
  joined_at: string
}

const emptyForm = { email: "", name: "", role: "dokter" as UserRole }

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })

export default function ManajemenStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token

  const loadRole = useCallback(async () => {
    setRoleLoading(true)
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) { setCurrentRole(null); return }
      // Ambil role dari profiles via supabase client
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()
      setCurrentRole((data?.role as UserRole) ?? "admin")
    } catch {
      setCurrentRole(null)
    } finally {
      setRoleLoading(false)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/staff", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setStaff(data.staff)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data staff")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRole()
  }, [loadRole])

  useEffect(() => {
    if (currentRole === "admin") load()
  }, [currentRole, load])

  const handleInvite = async () => {
    if (!form.email.trim() || !form.name.trim()) {
      setError("Email dan nama wajib diisi")
      return
    }
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const token = await getToken()
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setSuccess(`Undangan berhasil dikirim ke ${form.email}`)
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengirim undangan")
    } finally {
      setSaving(false)
    }
  }

  const handleChangeRole = async (id: string, role: UserRole) => {
    setError("")
    setSuccess("")
    try {
      const token = await getToken()
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, role }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setSuccess("Role berhasil diperbarui")
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengubah role")
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus staff "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return
    setError("")
    setSuccess("")
    try {
      const token = await getToken()
      const res = await fetch(`/api/staff?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setSuccess("Staff berhasil dihapus")
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menghapus staff")
    }
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Memuat...</div>
      </div>
    )
  }

  if (currentRole !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-red-300 text-xl font-semibold mb-2">Akses Ditolak</h2>
          <p className="text-slate-400 text-sm">
            Halaman ini hanya dapat diakses oleh Admin klinik.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Manajemen Staff</h1>
            <p className="text-slate-400 text-sm mt-1">Hanya admin yang bisa mengelola staff</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setError(""); setSuccess("") }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <span>+</span>
            <span>Undang Staff</span>
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-300 text-sm">
          Staff yang diundang akan mendapat email untuk set password mereka sendiri.
        </div>

        {/* Feedback */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 text-sm">
            {success}
          </div>
        )}

        {/* Form undang staff */}
        {showForm && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">Undang Staff Baru</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@staff.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Nama</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nama lengkap"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleInvite}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                {saving ? "Mengirim..." : "Kirim Undangan"}
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(emptyForm); setError("") }}
                className="bg-white/5 hover:bg-white/10 text-slate-300 px-5 py-2 rounded-xl text-sm transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Tabel staff */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Memuat data staff...</div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada staff. Klik &quot;+ Undang Staff&quot; untuk menambahkan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 font-medium px-5 py-3">Nama</th>
                    <th className="text-left text-slate-400 font-medium px-5 py-3">Email</th>
                    <th className="text-left text-slate-400 font-medium px-5 py-3">Role</th>
                    <th className="text-left text-slate-400 font-medium px-5 py-3">Bergabung</th>
                    <th className="text-left text-slate-400 font-medium px-5 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3 text-white font-medium">{s.name}</td>
                      <td className="px-5 py-3 text-slate-300">{s.email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE_COLORS[s.role] ?? ""}`}>
                          {ROLE_LABELS[s.role] ?? s.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{fmtDate(s.joined_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={s.role}
                            onChange={(e) => handleChangeRole(s.id, e.target.value as UserRole)}
                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500/50"
                          >
                            {(["admin", ...STAFF_ROLES] as UserRole[]).map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg px-2.5 py-1 text-xs transition-colors"
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
      </div>
    </div>
  )
}
