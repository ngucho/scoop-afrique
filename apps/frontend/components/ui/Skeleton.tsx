/**
 * Skeleton loading components for perceived performance.
 * Uses CSS shimmer animation from animations.css.
 */

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-4 w-full ${className}`} />
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-24 w-full rounded-lg ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="skeleton aspect-video w-full" />
      <div className="space-y-2 p-4">
        <SkeletonLine className="h-5 w-3/4" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-1/2" />
        <div className="flex gap-2 pt-2">
          <div className="skeleton h-3 w-16 rounded-full" />
          <div className="skeleton h-3 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonArticleGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 border-b border-border pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      {/* Table */}
      <div className="skeleton h-8 w-48 rounded" />
      <SkeletonTable />
    </div>
  )
}
