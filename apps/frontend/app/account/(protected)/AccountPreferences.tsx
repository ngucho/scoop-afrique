'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Heading } from 'scoop'
import type { Category } from '@/lib/api/types'

export type ReaderAccount = {
  auth0_sub: string
  email: string
  topic_category_ids: string[]
  digest_frequency: 'daily' | 'weekly' | 'monthly' | 'off'
  unsubscribed_at: string | null
  unsubscribe_token: string
  next_digest_at: string | null
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
  const [topicIds, setTopicIds] = useState<Set<string>>(new Set(initial.topic_category_ids))
  const [frequency, setFrequency] = useState(initial.digest_frequency)
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
