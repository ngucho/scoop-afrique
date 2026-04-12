'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, MoreHorizontal, Reply, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Avatar, Button, ConfirmDialog, Label, Textarea } from 'scoop'
import type { Article } from '@/lib/api/types'
import type { ContributionComment, ReaderContribution } from '@/lib/api/types'
import { config } from '@/lib/config'
import { formatDate } from '@/lib/formatDate'

const QUICK_EMOJIS = ['❤️', '🔥', '👏']
const EXTRA_EMOJIS = ['😂', '🤣', '😍', '🎉', '💯', '🤔', '😢', '😮', '👍', '✨', '🙏', '💪', '😭', '🤝', '⭐']
const COMMENT_QUICK = ['👍', '❤️', '🔥']

interface TribuneNoteCardProps {
  c: ReaderContribution
  myProfileId: string | null
  /** Compte lecteur avec permission Tribune (access:reader). */
  canInteract: boolean
  loginHref: string
  onDelete: (id: string) => void
  onEdit: (c: ReaderContribution) => void
}

type InteractionSnapshot = {
  upvote_count: number
  downvote_count: number
  your_vote: -1 | 0 | 1
  reactions: { emoji: string; count: number }[]
  your_reaction_emojis: string[]
  comment_count: number
}

function groupCommentsByParent(flat: ContributionComment[]) {
  const byParent = new Map<string | null, ContributionComment[]>()
  for (const m of flat) {
    const k = m.parent_id ?? null
    const arr = byParent.get(k) ?? []
    arr.push(m)
    byParent.set(k, arr)
  }
  return byParent
}

export function TribuneNoteCard({
  c,
  myProfileId,
  canInteract,
  loginHref,
  onDelete,
  onEdit,
}: TribuneNoteCardProps) {
  const isOwner = Boolean(myProfileId && c.user_id === myProfileId)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [up, setUp] = useState(c.upvote_count ?? 0)
  const [down, setDown] = useState(c.downvote_count ?? 0)
  const [yourVote, setYourVote] = useState<-1 | 0 | 1>(0)
  const [busy, setBusy] = useState(false)
  const [reactions, setReactions] = useState<{ emoji: string; count: number }[]>([])
  const [yourReactionEmojis, setYourReactionEmojis] = useState<string[]>([])
  const [emojiExtra, setEmojiExtra] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<ContributionComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [commentAnonymous, setCommentAnonymous] = useState(false)
  const [replyTo, setReplyTo] = useState<ContributionComment | null>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [commentCount, setCommentCount] = useState(c.comment_count ?? 0)

  const anon = Boolean(c.is_anonymous)
  const author = c.author
  const displayLabel = anon
    ? 'Anonyme'
    : author?.display_name || author?.pseudo || author?.email?.split('@')[0] || 'Lecteur'
  const profileHref =
    !anon && author?.pseudo ? `/tribune/u/${encodeURIComponent(author.pseudo)}` : null

  const byParent = useMemo(() => groupCommentsByParent(comments), [comments])
  const rootComments = byParent.get(null) ?? []

  useEffect(() => {
    setUp(c.upvote_count ?? 0)
    setDown(c.downvote_count ?? 0)
    setCommentCount(c.comment_count ?? 0)
  }, [c.upvote_count, c.downvote_count, c.comment_count])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch(`/api/reader-bff/contributions/${c.id}/interaction`)
      if (!res.ok || cancelled) return
      const json = (await res.json().catch(() => ({}))) as { data?: InteractionSnapshot }
      const d = json.data
      if (!d || cancelled) return
      setUp(d.upvote_count)
      setDown(d.downvote_count)
      setYourVote(d.your_vote ?? 0)
      setReactions(d.reactions ?? [])
      setYourReactionEmojis(d.your_reaction_emojis ?? [])
      setCommentCount(d.comment_count ?? c.comment_count ?? 0)
    })()
    return () => {
      cancelled = true
    }
  }, [c.id, c.comment_count])

  useEffect(() => {
    if (!c.article_id) {
      setArticle(null)
      return
    }
    let cancelled = false
    void (async () => {
      const base = config.apiBaseUrl.replace(/\/+$/, '')
      const res = await fetch(`${base}/api/v1/articles/${encodeURIComponent(c.article_id!)}`)
      if (!res.ok || cancelled) return
      const json = (await res.json()) as { data?: Article }
      if (!cancelled) setArticle(json.data ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [c.article_id])

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    try {
      const res = await fetch(`/api/reader-bff/contributions/${c.id}/comments`)
      if (!res.ok) return
      const json = (await res.json()) as { data?: ContributionComment[] }
      const list = json.data ?? []
      setComments(
        list.map((row) => ({
          ...row,
          reactions: row.reactions ?? [],
          your_reaction_emojis: row.your_reaction_emojis ?? [],
        })),
      )
    } finally {
      setCommentsLoading(false)
    }
  }, [c.id])

  useEffect(() => {
    if (commentsOpen) void loadComments()
  }, [commentsOpen, loadComments])

  const vote = async (value: 1 | -1) => {
    if (!canInteract || busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/reader-bff/contributions/${c.id}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        data?: { upvote_count: number; downvote_count: number; your_vote?: -1 | 0 | 1 }
      }
      if (res.ok && json.data) {
        setUp(json.data.upvote_count)
        setDown(json.data.downvote_count)
        if (json.data.your_vote !== undefined) setYourVote(json.data.your_vote)
      }
    } finally {
      setBusy(false)
    }
  }

  const react = async (emoji: string) => {
    if (!canInteract || busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/reader-bff/contributions/${c.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        data?: { reactions?: { emoji: string; count: number }[] }
      }
      if (res.ok && json.data?.reactions) {
        setReactions(json.data.reactions)
        const snap = await fetch(`/api/reader-bff/contributions/${c.id}/interaction`)
        if (snap.ok) {
          const j = (await snap.json().catch(() => ({}))) as { data?: InteractionSnapshot }
          if (j.data?.your_reaction_emojis) setYourReactionEmojis(j.data.your_reaction_emojis)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const submitComment = async () => {
    if (!commentBody.trim() || !canInteract || busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/reader-bff/contributions/${c.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: commentBody.trim(),
          is_anonymous: commentAnonymous,
          parent_id: replyTo?.id ?? null,
        }),
      })
      if (res.ok) {
        setCommentBody('')
        setReplyTo(null)
        setCommentCount((n) => n + 1)
        await loadComments()
        const snap = await fetch(`/api/reader-bff/contributions/${c.id}/interaction`)
        if (snap.ok) {
          const j = (await snap.json().catch(() => ({}))) as { data?: InteractionSnapshot }
          if (j.data?.comment_count !== undefined) setCommentCount(j.data.comment_count)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const toggleCommentReaction = async (commentId: string, emoji: string) => {
    if (!canInteract || busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/reader-bff/contributions/${c.id}/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      if (res.ok) await loadComments()
    } finally {
      setBusy(false)
    }
  }

  const followAuthor = async () => {
    if (!canInteract || !author?.profile_id || author.profile_id === myProfileId) return
    setBusy(true)
    try {
      await fetch(`/api/reader-bff/tribune/follow/${author.profile_id}`, { method: 'POST' })
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/reader-bff/contributions/${c.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(c.id)
  }

  const renderCommentBranch = (items: ContributionComment[], depth: number) => (
    <ul className={depth === 0 ? 'space-y-3' : 'mt-2 space-y-2 border-l border-border/60 pl-3'}>
      {items.map((cm) => {
        const kids = byParent.get(cm.id) ?? []
        const label = cm.is_anonymous
          ? 'Anonyme'
          : cm.author_display_name || cm.author_pseudo || cm.author_email?.split('@')[0] || 'Lecteur'
        const mine = cm.your_reaction_emojis ?? []
        return (
          <li key={cm.id} className="text-sm">
            <div className="flex gap-2">
              {!cm.is_anonymous && cm.author_avatar_url ? (
                <Avatar src={cm.author_avatar_url} alt="" size="sm" fallback={label.slice(0, 2)} />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {cm.is_anonymous ? '?' : label.slice(0, 2)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-semibold">{label}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(cm.created_at)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-foreground/90">{cm.body}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {COMMENT_QUICK.map((em) => (
                    <button
                      key={em}
                      type="button"
                      disabled={!canInteract || busy}
                      title={mine.includes(em) ? 'Retirer' : 'Réagir'}
                      className={`rounded-full px-1.5 py-0.5 text-sm transition-colors ${
                        mine.includes(em)
                          ? 'bg-primary/15 ring-2 ring-primary/40 ring-offset-1'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => void toggleCommentReaction(cm.id, em)}
                    >
                      {em}
                    </button>
                  ))}
                  {(cm.reactions ?? []).map((r) => (
                    <span key={r.emoji} className="text-xs text-muted-foreground">
                      {r.emoji} {r.count}
                    </span>
                  ))}
                  {canInteract ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs text-primary hover:bg-muted"
                      onClick={() => {
                        setReplyTo(cm)
                        setCommentsOpen(true)
                      }}
                    >
                      <Reply className="h-3 w-3" />
                      Répondre
                    </button>
                  ) : null}
                </div>
                {kids.length > 0 ? renderCommentBranch(kids, depth + 1) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )

  const voteBtn = (dir: 1 | -1, Icon: typeof ThumbsUp) => {
    const active = yourVote === dir
    return (
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
          active
            ? dir === 1
              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-500/15 text-rose-800 dark:text-rose-200'
            : 'text-muted-foreground hover:bg-muted'
        }`}
        onClick={() => void vote(dir)}
        disabled={busy || !canInteract}
      >
        <Icon className="h-3.5 w-3.5" />
        {dir === 1 ? up : down}
      </button>
    )
  }

  return (
    <article className="border-b border-border/60 px-4 py-4 transition-colors hover:bg-muted/10">
      <div className="flex gap-3">
        <div className="shrink-0">
          {anon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
              ?
            </div>
          ) : profileHref ? (
            <Link href={profileHref} prefetch={false}>
              <Avatar
                src={author?.avatar_url}
                alt={displayLabel}
                size="default"
                fallback={displayLabel.slice(0, 2)}
              />
            </Link>
          ) : (
            <Avatar
              src={author?.avatar_url}
              alt={displayLabel}
              size="default"
              fallback={displayLabel.slice(0, 2)}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {profileHref ? (
                  <Link href={profileHref} className="font-semibold hover:underline" prefetch={false}>
                    {displayLabel}
                  </Link>
                ) : (
                  <span className="font-semibold">{displayLabel}</span>
                )}
                {!anon && author?.pseudo ? (
                  <Link
                    href={profileHref!}
                    className="text-sm text-muted-foreground hover:underline"
                    prefetch={false}
                  >
                    @{author.pseudo}
                  </Link>
                ) : null}
                <span className="text-sm text-muted-foreground">· {formatDate(c.created_at)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {c.kind === 'event' ? 'Événement' : 'Tribune'}
              </p>
            </div>
            {isOwner ? (
              <div className="relative">
                <button
                  type="button"
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 z-10 mt-1 min-w-[10rem] rounded-lg border border-border bg-popover py-1 text-sm shadow-md">
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left hover:bg-muted"
                      onClick={() => {
                        setMenuOpen(false)
                        onEdit(c)
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-destructive hover:bg-muted"
                      onClick={() => {
                        setMenuOpen(false)
                        setConfirmDelete(true)
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <h3 className="mt-1 text-base font-semibold leading-snug">{c.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/95">{c.body}</p>

          {c.kind === 'event' && (c.event_location || c.event_starts_at) ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {c.event_location ? `${c.event_location}` : ''}
              {c.event_starts_at ? ` · ${formatDate(c.event_starts_at)}` : ''}
            </p>
          ) : null}

          {c.article_id && article ? (
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">Réf. article : </span>
              <Link href={`/articles/${article.slug}`} className="font-medium text-primary hover:underline" prefetch={false}>
                {article.title}
              </Link>
            </p>
          ) : c.article_id ? (
            <p className="mt-2 text-xs text-muted-foreground">Réf. article (chargement…)</p>
          ) : null}

          {!isOwner && canInteract && author?.profile_id ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void followAuthor()}>
                Suivre · tribune perso
              </Button>
              {profileHref ? (
                <Link href={profileHref} prefetch={false}>
                  <Button type="button" variant="ghost" size="sm">
                    Voir le profil
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border/50 pt-3">
            {canInteract ? (
              <>
                {voteBtn(1, ThumbsUp)}
                {voteBtn(-1, ThumbsDown)}
                {QUICK_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={`rounded-full px-1.5 py-0.5 text-base leading-none transition-colors disabled:opacity-50 ${
                      yourReactionEmojis.includes(em)
                        ? 'bg-primary/15 ring-2 ring-primary/50 ring-offset-2'
                        : 'hover:bg-muted'
                    }`}
                    title="Réagir"
                    onClick={() => void react(em)}
                    disabled={busy}
                  >
                    {em}
                  </button>
                ))}
                <div className="relative">
                  <button
                    type="button"
                    className="rounded-full px-2 py-0.5 text-xs font-medium text-primary hover:bg-muted"
                    onClick={() => setEmojiExtra((e) => !e)}
                  >
                    +
                  </button>
                  {emojiExtra ? (
                    <div className="absolute bottom-full left-0 z-20 mb-1 flex max-w-[220px] flex-wrap gap-1 rounded-lg border border-border bg-popover p-2 shadow-md">
                      {EXTRA_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          className={`rounded p-0.5 text-lg hover:bg-muted ${
                            yourReactionEmojis.includes(em) ? 'ring-2 ring-primary/50' : ''
                          }`}
                          onClick={() => {
                            void react(em)
                            setEmojiExtra(false)
                          }}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                {reactions.map((r) => (
                  <span key={r.emoji} className="text-xs text-muted-foreground">
                    {r.emoji} {r.count}
                  </span>
                ))}
                <button
                  type="button"
                  className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                  onClick={() => setCommentsOpen((o) => !o)}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Commentaires
                  <span className="rounded-full bg-muted px-1.5 py-0 text-[10px] font-semibold tabular-nums text-foreground">
                    {commentCount}
                  </span>
                </button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                <Link href={loginHref} className="font-medium text-primary underline" prefetch={false}>
                  Connectez-vous
                </Link>{' '}
                avec un compte lecteur pour interagir.
              </span>
            )}
          </div>

          {commentsOpen ? (
            <div className="mt-3 space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
              {commentsLoading ? (
                <p className="text-xs text-muted-foreground">Chargement des commentaires…</p>
              ) : (
                renderCommentBranch(rootComments, 0)
              )}
              {canInteract ? (
                <div className="space-y-2 border-t border-border/50 pt-3">
                  {replyTo ? (
                    <p className="text-xs text-muted-foreground">
                      Réponse à{' '}
                      <span className="font-medium text-foreground">
                        {replyTo.is_anonymous
                          ? 'Anonyme'
                          : replyTo.author_display_name || replyTo.author_pseudo || 'Lecteur'}
                      </span>
                      <button
                        type="button"
                        className="ml-2 text-primary underline"
                        onClick={() => setReplyTo(null)}
                      >
                        Annuler
                      </button>
                    </p>
                  ) : null}
                  <Label size="sm" className="text-muted-foreground">
                    Votre commentaire
                  </Label>
                  <Textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    rows={3}
                    className="rounded-lg text-sm"
                  />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={commentAnonymous}
                      onChange={(e) => setCommentAnonymous(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-input"
                    />
                    Commenter en anonyme
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || !commentBody.trim()}
                    onClick={() => void submitComment()}
                  >
                    Publier le commentaire
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer cette note ?"
        message="Cette action est définitive."
        variant="danger"
        confirmLabel="Supprimer"
        onConfirm={() => void handleDelete()}
      />
    </article>
  )
}
