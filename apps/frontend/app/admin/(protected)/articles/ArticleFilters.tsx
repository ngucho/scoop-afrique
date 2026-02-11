'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { STATUS_LABELS } from '@/lib/admin/rbac'

const STATUSES = [
  { value: '', label: 'Tous' },
  { value: 'draft', label: STATUS_LABELS.draft },
  { value: 'review', label: STATUS_LABELS.review },
  { value: 'scheduled', label: STATUS_LABELS.scheduled },
  { value: 'published', label: STATUS_LABELS.published },
]

export function ArticleFilters({
  currentStatus,
  currentQuery,
}: {
  currentStatus?: string
  currentQuery?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function navigate(status?: string, q?: string) {
    const sp = new URLSearchParams()
    if (status) sp.set('status', status)
    if (q) sp.set('q', q)
    startTransition(() => {
      router.push(`/admin/articles?${sp.toString()}`)
    })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => navigate(s.value, currentQuery)}
            disabled={isPending}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              (currentStatus ?? '') === s.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form
        className="flex-1"
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.currentTarget
          const q = (form.elements.namedItem('q') as HTMLInputElement)?.value?.trim()
          navigate(currentStatus, q || undefined)
        }}
      >
        <input
          name="q"
          type="search"
          placeholder="Rechercher un article..."
          defaultValue={currentQuery}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </form>
    </div>
  )
}
