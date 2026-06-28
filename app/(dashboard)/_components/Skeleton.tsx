export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-800/60 ${className ?? ""}`} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-700/20 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
    </div>
  )
}
