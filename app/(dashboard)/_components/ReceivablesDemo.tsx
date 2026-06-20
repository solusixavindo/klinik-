"use client"

type Receivable = {
  patient: string
  invoice: string
  amount: number
  due: string
  status: string
}

const receivables: Receivable[] = [
  { patient: "Ahmad Rahman", invoice: "INV-2026-001", amount: 250000, due: "3 hari lagi", status: "Belum Lunas" },
  { patient: "Siti Aminah", invoice: "INV-2026-002", amount: 175000, due: "7 hari lagi", status: "Belum Lunas" },
  { patient: "Budi Santoso", invoice: "INV-2026-003", amount: 420000, due: "1 hari lagi", status: "Belum Lunas" },
]

const csvEscape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

export default function ReceivablesDemo() {
  const total = receivables.reduce((sum, item) => sum + item.amount, 0)

  const exportCsv = () => {
    const headers = ["Pasien", "Invoice", "Jumlah", "Jatuh Tempo", "Status"]
    const rows = receivables.map((item) => [
      item.patient,
      item.invoice,
      item.amount,
      item.due,
      item.status,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n")
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")

    anchor.href = url
    anchor.download = `piutang-pasien-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Operasional</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Piutang Pasien</h1>
          <p className="mt-2 max-w-2xl text-slate-400">Kelola tagihan pasien dan monitoring piutang segera lunas.</p>
        </div>
        <button onClick={exportCsv} className="btn-secondary">Export Daftar</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Total Piutang</p>
          <h2 className="mt-3 text-4xl font-bold text-white">Rp {total.toLocaleString("id-ID")}</h2>
          <p className="mt-2 text-xs text-slate-500">Jumlah piutang yang harus ditagih.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Jatuh Tempo</p>
          <h2 className="mt-3 text-4xl font-bold text-white">{receivables.length}</h2>
          <p className="mt-2 text-xs text-slate-500">Invoice mendekati tanggal jatuh tempo.</p>
        </div>
        <div className="rounded-3xl border border-slate-700/20 bg-slate-900/40 p-6 shadow-md">
          <p className="text-sm text-slate-400">Lunas</p>
          <h2 className="mt-3 text-4xl font-bold text-white">68%</h2>
          <p className="mt-2 text-xs text-slate-500">Persentase piutang yang berhasil ditagih.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-4 shadow-md">
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-700/20">
              <th className="px-4 py-3">Pasien</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Jatuh Tempo</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {receivables.map((item) => (
              <tr key={item.invoice} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                <td className="px-4 py-3 font-medium text-white">{item.patient}</td>
                <td className="px-4 py-3">{item.invoice}</td>
                <td className="px-4 py-3">Rp {item.amount.toLocaleString("id-ID")}</td>
                <td className="px-4 py-3">{item.due}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
