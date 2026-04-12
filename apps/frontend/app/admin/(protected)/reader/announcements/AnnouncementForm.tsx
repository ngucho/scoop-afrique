'use client'

import { useCallback, useTransition } from 'react'
import { Input, Textarea } from 'scoop'
import { IconLoader2, IconPlus } from '@tabler/icons-react'
import { createAnnouncement } from '@/lib/admin/actions'
import { useFormDraftState } from '@/hooks/useFormDraft'

const PLACEMENT_OPTIONS: { value: 'banner' | 'modal' | 'inline' | 'footer'; label: string }[] = [
  { value: 'banner', label: 'Bandeau principal (haut de page)' },
  { value: 'footer', label: 'Fil info / secondaire' },
  { value: 'modal', label: 'Modal (réservé)' },
  { value: 'inline', label: 'Dans le corps des articles' },
]

type Draft = {
  title: string
  body: string
  audience: 'all' | 'subscribers' | 'guests'
  placement: 'banner' | 'modal' | 'inline' | 'footer'
  priority: number
  linkUrl: string
}

export function AnnouncementForm() {
  const getDefaults = useCallback(
    (): Draft => ({
      title: '',
      body: '',
      audience: 'all',
      placement: 'banner',
      priority: 0,
      linkUrl: '',
    }),
    [],
  )

  const [form, setForm, clearDraft] = useFormDraftState('admin:reader:announcements:new', getDefaults)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    startTransition(async () => {
      try {
        await createAnnouncement({
          title: form.title.trim(),
          body: form.body.trim(),
          audience: form.audience,
          placement: form.placement,
          priority: form.priority,
          link_url: form.linkUrl.trim() || null,
          is_active: true,
          starts_at: null,
          ends_at: null,
        })
        clearDraft()
      } catch {
        alert('Erreur lors de la création.')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <p className="text-sm font-medium">Nouvelle annonce</p>
      <p className="text-xs text-muted-foreground">Brouillon conservé localement jusqu’à envoi réussi.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Titre</label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Audience</label>
          <select
            value={form.audience}
            onChange={(e) =>
              setForm((f) => ({ ...f, audience: e.target.value as Draft['audience'] }))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">Tous les visiteurs</option>
            <option value="subscribers">Abonnés newsletter</option>
            <option value="guests">Non abonnés</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Emplacement</label>
          <select
            value={form.placement}
            onChange={(e) =>
              setForm((f) => ({ ...f, placement: e.target.value as Draft['placement'] }))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {PLACEMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Priorité (0–999)</label>
          <Input
            type="number"
            min={0}
            max={999}
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Lien optionnel (URL)</label>
          <Input
            value={form.linkUrl}
            onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
            placeholder="https://…"
            type="url"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Message</label>
          <Textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={4}
            required
            className="min-h-[100px]"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconPlus className="h-4 w-4" />}
          Créer (audité)
        </button>
        <button
          type="button"
          onClick={clearDraft}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          Effacer le brouillon
        </button>
      </div>
    </form>
  )
}
