"use client"

export function ConfirmDialog({
  message,
  confirmLabel = "Ya, Lanjutkan",
  danger = false,
  onConfirm,
  onCancel,
}: {
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-[24px] border border-slate-700/40 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/40">
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${danger ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
            {danger ? "⚠" : "?"}
          </div>
          <p className="text-sm font-semibold text-slate-200 leading-snug">{message}</p>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition ${danger ? "bg-red-600/80 hover:bg-red-600" : "bg-indigo-600/80 hover:bg-indigo-600"}`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-700/60 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/50 hover:text-white"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}
