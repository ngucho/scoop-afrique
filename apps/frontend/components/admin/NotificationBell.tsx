'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { IconBell, IconMessageCircle, IconEdit } from '@tabler/icons-react'

export interface EditorialNotificationItem {
  article_id: string
  article_title: string
  article_slug: string
  unresolved_count: number
}

export interface ReaderCommentNotificationItem {
  article_id: string
  article_title: string
  article_slug: string
  pending_count: number
}

export interface UserNotifications {
  editorial: EditorialNotificationItem[]
  editorial_total: number
  reader_pending: ReaderCommentNotificationItem[]
  reader_pending_total: number
}

async function fetchNotifications(): Promise<UserNotifications> {
  const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch notifications')
  const json = await res.json()
  const data = json.data ?? json
  return {
    editorial: data.editorial ?? [],
    editorial_total: data.editorial_total ?? 0,
    reader_pending: data.reader_pending ?? [],
    reader_pending_total: data.reader_pending_total ?? 0,
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<UserNotifications | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const next = await fetchNotifications()
      setData(next)
    } catch {
      setError(true)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (open && data === null && !loading) load()
  }, [open, data, loading, load])

  const total = data
    ? data.editorial_total + data.reader_pending_total
    : 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={total > 0 ? `${total} notification(s)` : 'Notifications'}
      >
        <IconBell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg animate-slide-down">
            <div className="border-b border-border px-3 py-2">
              <h3 className="text-sm font-semibold text-foreground">
                Notifications
              </h3>
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {loading && !data && (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Chargement…
                </p>
              )}
              {error && (
                <p className="px-3 py-4 text-center text-sm text-destructive">
                  Erreur lors du chargement.
                </p>
              )}
              {data && total === 0 && (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Aucune notification.
                </p>
              )}
              {data && data.editorial.length > 0 && (
                <div className="mb-2">
                  <p className="mb-1 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Commentaires éditoriaux
                  </p>
                  <ul className="space-y-0.5">
                    {data.editorial.map((item) => (
                      <li key={item.article_id}>
                        <Link
                          href={`/admin/articles/${item.article_id}/edit`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
                        >
                          <IconEdit className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate flex-1" title={item.article_title}>
                            {item.article_title}
                          </span>
                          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                            {item.unresolved_count}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data && data.reader_pending.length > 0 && (
                <div>
                  <p className="mb-1 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Commentaires lecteurs en attente
                  </p>
                  <ul className="space-y-0.5">
                    {data.reader_pending.map((item) => (
                      <li key={item.article_id}>
                        <Link
                          href="/admin/comments?status=pending"
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
                        >
                          <IconMessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate flex-1" title={item.article_title}>
                            {item.article_title}
                          </span>
                          <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                            {item.pending_count}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
