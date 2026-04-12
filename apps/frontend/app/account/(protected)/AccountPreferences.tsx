'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Heading, Input, Textarea, Label } from 'scoop'
import type { Category } from '@/lib/api/types'

export type ReaderPublicProfile = {
  display_name: string | null
  pseudo: string | null
  avatar_url: string | null
  date_of_birth: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  postal_code: string | null
  country_code: string | null
  bio: string | null
  interest_category_ids: string[]
}

export type ReaderAccount = {
  auth0_sub: string
  email: string
  topic_category_ids: string[]
  digest_frequency: 'daily' | 'weekly' | 'monthly' | 'off'
  unsubscribed_at: string | null
  unsubscribe_token: string
  next_digest_at: string | null
  /** Profil Scoop (UUID) — Tribune, suivis, contributions. */
  profile_id?: string
  profile?: ReaderPublicProfile | null
}

const frequencies: { value: ReaderAccount['digest_frequency']; label: string }[] = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'off', label: 'Aucun email' },
]

export function AccountPreferences({
  initial,
  categories,
  apiBaseUrl,
}: {
  initial: ReaderAccount
  categories: Category[]
  apiBaseUrl: string
}) {
  const router = useRouter()
  const p0 = initial.profile
  const [topicIds, setTopicIds] = useState<Set<string>>(new Set(initial.topic_category_ids))
  const [interestIds, setInterestIds] = useState<Set<string>>(new Set(p0?.interest_category_ids ?? []))
  const [frequency, setFrequency] = useState(initial.digest_frequency)
  const [displayName, setDisplayName] = useState(p0?.display_name ?? '')
  const [pseudo, setPseudo] = useState(p0?.pseudo ?? '')
  const [avatarUrl, setAvatarUrl] = useState(p0?.avatar_url ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(p0?.date_of_birth ?? '')
  const [address1, setAddress1] = useState(p0?.address_line1 ?? '')
  const [address2, setAddress2] = useState(p0?.address_line2 ?? '')
  const [city, setCity] = useState(p0?.city ?? '')
  const [postalCode, setPostalCode] = useState(p0?.postal_code ?? '')
  const [countryCode, setCountryCode] = useState(p0?.country_code ?? '')
  const [bio, setBio] = useState(p0?.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const toggleTopic = (id: string) => {
    setTopicIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleInterest = (id: string) => {
    setInterestIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/reader/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_category_ids: Array.from(topicIds),
          digest_frequency: frequency,
          display_name: displayName.trim() || null,
          pseudo: pseudo.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          date_of_birth: dateOfBirth.trim() || null,
          address_line1: address1.trim() || null,
          address_line2: address2.trim() || null,
          city: city.trim() || null,
          postal_code: postalCode.trim() || null,
          country_code: countryCode.trim() || null,
          bio: bio.trim() || null,
          interest_category_ids: Array.from(interestIds),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessage(typeof err?.error === 'string' ? err.error : 'Enregistrement impossible.')
        return
      }
      setMessage('Préférences enregistrées.')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const oneClickUrl = `${apiBaseUrl.replace(/\/+$/, '')}/api/v1/digest/unsubscribe?t=${encodeURIComponent(initial.unsubscribe_token)}`

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
      <header>
        <Heading as="h1" level="h1" className="mb-2">
          Mon compte
        </Heading>
        <p className="text-muted-foreground text-sm">{initial.email}</p>
      </header>

      <section className="space-y-4 rounded-lg border border-border p-4">
        <Heading as="h2" level="h2" className="text-lg">
          Profil public
        </Heading>
        <p className="text-muted-foreground text-sm">
          Ces informations sont enregistrées sur votre compte et synchronisées avec Auth0 lorsque la Management API est
          configurée côté serveur.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label size="sm">Nom affiché</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-md" />
          </div>
          <div className="space-y-1">
            <Label size="sm">Pseudo</Label>
            <Input
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="lettres, chiffres, _ -"
              className="rounded-md"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm">Photo (URL)</Label>
            <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="rounded-md" />
          </div>
          <div className="space-y-1">
            <Label size="sm">Date de naissance</Label>
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="rounded-md" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm">Adresse ligne 1</Label>
            <Input value={address1} onChange={(e) => setAddress1(e.target.value)} className="rounded-md" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm">Adresse ligne 2</Label>
            <Input value={address2} onChange={(e) => setAddress2(e.target.value)} className="rounded-md" />
          </div>
          <div className="space-y-1">
            <Label size="sm">Ville</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-md" />
          </div>
          <div className="space-y-1">
            <Label size="sm">Code postal</Label>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="rounded-md" />
          </div>
          <div className="space-y-1">
            <Label size="sm">Pays (code)</Label>
            <Input value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="rounded-md" />
          </div>
        </div>
        <div className="space-y-1">
          <Label size="sm">Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="rounded-md" />
        </div>
        <div className="space-y-2">
          <Label size="sm">Centres d&apos;intérêt (profil)</Label>
          <ul className="grid gap-2 sm:grid-cols-2">
            {categories.map((c) => (
              <li key={`int-${c.id}`}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={interestIds.has(c.id)}
                    onChange={() => toggleInterest(c.id)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span>{c.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <Heading as="h2" level="h2" className="text-lg">
          Thématiques (digest)
        </Heading>
        <p className="text-muted-foreground text-sm">
          Cochez les rubriques à mettre en avant dans votre sélection. Si aucune n&apos;est choisie, nous vous
          envoyons une sélection générale.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {categories.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={topicIds.has(c.id)}
                  onChange={() => toggleTopic(c.id)}
                  className="h-4 w-4 rounded border-input"
                />
                <span>{c.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <Heading as="h2" level="h2" className="text-lg">
          Fréquence du digest
        </Heading>
        <div className="flex flex-wrap gap-2">
          {frequencies.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFrequency(f.value)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                frequency === f.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {initial.next_digest_at && frequency !== 'off' && (
          <p className="text-muted-foreground text-xs">
            Prochain envoi prévu vers : {new Date(initial.next_digest_at).toLocaleString('fr-FR')}
          </p>
        )}
      </section>

      <section className="space-y-2 rounded-lg border border-border p-4">
        <Heading as="h2" level="h2" className="text-lg">
          Désabonnement
        </Heading>
        <p className="text-muted-foreground text-sm">
          Lien de désabonnement en un clic (également présent en pied de chaque email) :
        </p>
        <a
          href={oneClickUrl}
          className="text-primary text-sm underline underline-offset-2"
        >
          Me désabonner des emails
        </a>
        {initial.unsubscribed_at && (
          <p className="text-amber-700 text-xs dark:text-amber-400">
            Désabonné le {new Date(initial.unsubscribed_at).toLocaleString('fr-FR')}. Choisissez une fréquence
            ci-dessus pour vous réabonner.
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        {message && <span className="text-muted-foreground text-sm">{message}</span>}
      </div>

      <p className="text-muted-foreground text-xs">
        <a href="/reader/auth/logout" className="underline underline-offset-2">
          Déconnexion
        </a>
      </p>
    </div>
  )
}
