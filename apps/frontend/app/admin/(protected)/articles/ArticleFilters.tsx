'use client'

import { useRouter } from 'next/navigation'
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
    <div className="rounded-[1.25rem] border border-border bg-card p-3 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <p className="font-sans text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground lg:w-20">
        Filtres
      </p>
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => navigate(s.value, currentQuery)}
            disabled={isPending}
            className={`rounded-full px-3 py-1.5 font-sans text-xs font-black uppercase tracking-[0.08em] transition-colors ${
              (currentStatus ?? '') === s.value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

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
          className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        />
      </form>
      </div>
    </div>
  )
}
