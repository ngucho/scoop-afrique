'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconEdit } from '@tabler/icons-react'
import type { Comment } from '@/lib/api/types'
import { config } from '@/lib/config'
import { formatDate } from '@/lib/formatDate'

function initialsFromEmail(email: string | null | undefined): string {
  if (!email) return '?'
  const local = email.split('@')[0] ?? '?'
  const parts = local.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

interface ArticleCommentsSectionProps {
  articleId: string
}

export function ArticleCommentsSection({ articleId }: ArticleCommentsSectionProps) {
  const pathname = usePathname()
  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/v1/articles/${articleId}/comments`)
      if (!res.ok) return
      const json = (await res.json()) as { data: Comment[]; total: number }
      setComments(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [articleId])

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch('/api/reader-session')
      if (!res.ok) return
      const json = (await res.json()) as { authenticated: boolean }
      setAuthenticated(!!json.authenticated)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadComments()
    loadSession()
  }, [loadComments, loadSession])

  const submit = async () => {
    const body = draft.trim()
    if (!body || submitting) return
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/reader-bff/article-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, body }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setMessage(json.error ?? 'Envoi impossible. Réessayez.')
        return
      }
      setDraft('')
      setMessage('Merci. Votre message est en modération et apparaîtra après validation par la rédaction.')
      await loadComments()
    } catch {
      setMessage('Erreur réseau.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-16 rounded-[2rem] bg-editorial-surface-low p-6 md:p-12">
      <div className="mb-8 flex items-center gap-4">
        <IconEdit className="h-8 w-8 shrink-0 text-primary" aria-hidden />
        <h2 className="text-2xl font-bold tracking-tight text-editorial-on-surface md:text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>
          L&apos;avis des lecteurs
        </h2>
      </div>

      <div className="mb-8 rounded-2xl bg-editorial-surface-lowest p-6 shadow-[var(--shadow-lg)] outline outline-1 outline-editorial-outline-variant/10">
        {!authenticated ? (
          <p className="text-sm text-editorial-secondary">
            <Link
              href={`/reader/auth/login?returnTo=${encodeURIComponent(pathname || '/articles')}`}
              className="font-semibold text-primary underline-offset-4 hover:underline"
              prefetch={false}
            >
              Connectez-vous
            </Link>{' '}
            pour partager votre analyse sur cet article. Les contributions sont relues par la rédaction avant publication.
          </p>
        ) : (
          <>
            <label htmlFor="reader-comment" className="sr-only">
              Votre commentaire
            </label>
            <textarea
              id="reader-comment"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              placeholder="Partagez votre analyse ou votre point de vue sur ce sujet…"
              className="w-full resize-y border-0 bg-transparent text-sm font-medium text-editorial-on-surface placeholder:text-editorial-secondary/70 focus:ring-0 focus:outline-none"
            />
            <div className="mt-4 flex justify-end border-t border-editorial-outline-variant/15 pt-4">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting || !draft.trim()}
                className="rounded-full bg-primary px-6 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
                style={{ transitionDuration: 'var(--motion-duration-base)', transitionTimingFunction: 'var(--motion-ease-out)' }}
              >
                {submitting ? 'Envoi…' : 'Contribuer'}
              </button>
            </div>
          </>
        )}
        {message ? <p className="mt-3 text-sm text-editorial-secondary">{message}</p> : null}
      </div>

      <div className="space-y-6">
        {loading ? (
          <p className="text-sm text-editorial-secondary">Chargement des commentaires…</p>
        ) : total === 0 ? (
          <p className="text-sm text-editorial-secondary">Soyez le premier à réagir après publication des contributions approuvées.</p>
        ) : (
          comments.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border-l-2 border-primary/20 bg-editorial-surface-lowest p-6"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-editorial-tertiary-container text-xs font-bold text-[var(--editorial-tertiary)]">
                  {initialsFromEmail(c.author?.email)}
                </div>
                <div>
                  <p className="text-xs font-bold text-editorial-on-surface">
                    {c.author?.email?.split('@')[0] ?? 'Lecteur'}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-editorial-secondary">{formatDate(c.created_at)}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-editorial-on-surface/90 whitespace-pre-wrap">{c.body}</p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
