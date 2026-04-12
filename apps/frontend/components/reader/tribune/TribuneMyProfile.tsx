'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { Avatar, Button, Dialog, Heading, Input, Label, Textarea } from 'scoop'
import type { Category } from '@/lib/api/types'
import type { ReaderContribution } from '@/lib/api/types'
import { TribuneComposeModal } from '@/components/reader/tribune/TribuneComposeModal'
import { TribuneNoteCard } from '@/components/reader/tribune/TribuneNoteCard'
import type { TribuneAccess } from '@/lib/tribune-access'
import type { ReaderAccount } from '@/app/account/(protected)/AccountPreferences'

function normalizeContribution(c: ReaderContribution): ReaderContribution {
  return {
    ...c,
    author: c.author ?? null,
    is_anonymous: Boolean(c.is_anonymous),
  }
}

export function TribuneMyProfile({ categories }: { categories: Category[] }) {
  const pathname = usePathname()
  const loginHref = `/reader/auth/login?returnTo=${encodeURIComponent(pathname || '/tribune/profile')}`
  const [authenticated, setAuthenticated] = useState(false)
  const [tribuneAccess, setTribuneAccess] = useState<TribuneAccess>('anonymous')
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<ReaderAccount | null>(null)
  const [contributions, setContributions] = useState<ReaderContribution[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [editContribution, setEditContribution] = useState<ReaderContribution | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const p0 = me?.profile
  const [displayName, setDisplayName] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [interestIds, setInterestIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    const sessionRes = await fetch('/api/reader-session')
    const session = (await sessionRes.json()) as { authenticated?: boolean; tribune_access?: TribuneAccess }
    setAuthenticated(!!session.authenticated)
    if (session.tribune_access) setTribuneAccess(session.tribune_access)
    if (!session.authenticated) {
      setLoading(false)
      return
    }
    const meRes = await fetch('/api/reader/me')
    if (!meRes.ok) {
      setMe(null)
      setLoading(false)
      return
    }
    const meJson = (await meRes.json()) as { data?: ReaderAccount }
    const account = meJson.data ?? null
    setMe(account)
    if (account?.profile) {
      setDisplayName(account.profile.display_name ?? '')
      setPseudo(account.profile.pseudo ?? '')
      setAvatarUrl(account.profile.avatar_url ?? '')
      setBio(account.profile.bio ?? '')
      setInterestIds(new Set(account.profile.interest_category_ids ?? []))
    }

    const cRes = await fetch('/api/reader/me/contributions?limit=24')
    if (cRes.ok) {
      const cJson = (await cRes.json()) as { data?: ReaderContribution[]; next_cursor?: string | null }
      setContributions((cJson.data ?? []).map(normalizeContribution))
      setNextCursor(cJson.next_cursor ?? null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/reader/me/contributions?limit=24&cursor=${encodeURIComponent(nextCursor)}`)
      if (!res.ok) return
      const json = (await res.json()) as { data?: ReaderContribution[]; next_cursor?: string | null }
      const more = (json.data ?? []).map(normalizeContribution)
      setContributions((prev) => {
        const seen = new Set(prev.map((p) => p.id))
        return [...prev, ...more.filter((m) => !seen.has(m.id))]
      })
      setNextCursor(json.next_cursor ?? null)
    } finally {
      setLoadingMore(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/reader/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          pseudo: pseudo.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          bio: bio.trim() || null,
          interest_category_ids: Array.from(interestIds),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMsg(typeof err?.error === 'string' ? err.error : 'Enregistrement impossible.')
        return
      }
      setMsg('Profil mis à jour.')
      setEditOpen(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const toggleInterest = (id: string) => {
    setInterestIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const myProfileId = me?.profile_id ?? null
  const publicPseudo = p0?.pseudo

  if (loading) {
    return <p className="p-8 text-center text-muted-foreground">Chargement du profil…</p>
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">Connectez-vous pour voir votre profil Tribune.</p>
        <Link href={loginHref} className="font-medium text-primary underline" prefetch={false}>
          Connexion
        </Link>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">Impossible de charger votre profil.</p>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/30 via-muted to-background md:h-52">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 to-transparent" />
      </div>

      <div className="mx-auto max-w-3xl px-4">
        <div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar
              src={p0?.avatar_url}
              alt={p0?.display_name ?? me.email}
              size="lg"
              className="h-28 w-28 border-4 border-background text-2xl"
              fallback={(p0?.display_name ?? me.email).slice(0, 2)}
            />
            <div className="pb-1">
              <Heading as="h1" level="h1" className="text-2xl md:text-3xl">
                {p0?.display_name || 'Votre profil'}
              </Heading>
              {publicPseudo ? (
                <p className="text-muted-foreground">
                  @{publicPseudo} ·{' '}
                  <Link href={`/tribune/u/${encodeURIComponent(publicPseudo)}`} className="text-primary hover:underline" prefetch={false}>
                    Voir la page publique
                  </Link>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Ajoutez un pseudo pour une URL publique.</p>
              )}
            </div>
          </div>
          <Button type="button" variant="secondary" className="shrink-0 gap-2" onClick={() => setEditOpen(true)}>
            <Settings className="h-4 w-4" aria-hidden />
            Modifier le profil
          </Button>
        </div>

        {p0?.bio ? <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-foreground/90">{p0.bio}</p> : null}

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="/tribune/network" className="rounded-full border border-border px-4 py-2 font-medium hover:bg-muted/50" prefetch={false}>
            Mon réseau (suivis / abonnés)
          </Link>
          <Link href="/tribune" className="rounded-full border border-border px-4 py-2 font-medium hover:bg-muted/50" prefetch={false}>
            Retour au fil
          </Link>
        </div>

        <Heading as="h2" level="h2" className="mt-10 text-xl">
          Mes notes
        </Heading>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border/80 bg-card">
          {contributions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Vous n’avez pas encore publié de note.</p>
          ) : (
            contributions.map((c) => (
              <TribuneNoteCard
                key={c.id}
                c={c}
                myProfileId={myProfileId}
                canInteract={tribuneAccess === 'reader'}
                loginHref={loginHref}
                onDelete={(id) => setContributions((prev) => prev.filter((p) => p.id !== id))}
                onEdit={(c) => {
                  setEditContribution(c)
                  setComposeOpen(true)
                }}
              />
            ))
          )}
        </div>
        {nextCursor ? (
          <Button type="button" variant="secondary" className="mt-4" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? 'Chargement…' : 'Charger plus'}
          </Button>
        ) : null}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Modifier le profil"
        className="max-h-[90vh] max-w-lg overflow-y-auto"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void saveProfile()} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        {msg ? <p className="mb-3 text-sm text-muted-foreground">{msg}</p> : null}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label size="sm">Nom affiché</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-1">
            <Label size="sm">Pseudo (URL publique)</Label>
            <Input value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="lettres, chiffres, _ -" className="rounded-lg" />
          </div>
          <div className="space-y-1">
            <Label size="sm">Photo (URL)</Label>
            <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-1">
            <Label size="sm">Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label size="sm">Centres d&apos;intérêt</Label>
            <ul className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={interestIds.has(c.id)}
                      onChange={() => toggleInterest(c.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    {c.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Dialog>

      <TribuneComposeModal
        open={composeOpen}
        onOpenChange={(o) => {
          setComposeOpen(o)
          if (!o) setEditContribution(null)
        }}
        editContribution={editContribution}
        onPosted={() => void load()}
      />
    </div>
  )
}
