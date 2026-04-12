'use client'

import { useCallback, useTransition } from 'react'
import { Input, Textarea } from 'scoop'
import { IconLoader2, IconPlus } from '@tabler/icons-react'
import { createNewsletterCampaign } from '@/lib/admin/actions'
import { useFormDraftState } from '@/hooks/useFormDraft'

type Draft = {
  name: string
  cadence: 'daily' | 'weekly' | 'monthly'
  subject: string
  preheader: string
  filterJson: string
  sendAt: string
}

export function NewsletterCampaignForm() {
  const getDefaults = useCallback(
    (): Draft => ({
      name: '',
      cadence: 'weekly',
      subject: '',
      preheader: '',
      filterJson: '{"tags_any": []}',
      sendAt: '',
    }),
    [],
  )

  const [form, setForm, clearDraft] = useFormDraftState('admin:reader:newsletters:new-campaign', getDefaults)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.subject.trim()) return
    let segment_filter: Record<string, unknown>
    try {
      segment_filter = JSON.parse(form.filterJson) as Record<string, unknown>
    } catch {
      alert('Filtre segment (JSON) invalide.')
      return
    }
    startTransition(async () => {
      try {
        await createNewsletterCampaign({
          name: form.name.trim(),
          cadence: form.cadence,
          subject_template: form.subject.trim(),
          preheader: form.preheader.trim() || null,
          segment_filter,
          status: form.sendAt ? 'scheduled' : 'draft',
          send_at: form.sendAt ? new Date(form.sendAt).toISOString() : null,
        })
        clearDraft()
      } catch {
        alert('Erreur.')
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">Nouvelle campagne</p>
      <p className="text-xs text-muted-foreground">Brouillon sauvegardé localement jusqu’à création réussie.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nom interne</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Cadence</label>
          <select
            value={form.cadence}
            onChange={(e) =>
              setForm((f) => ({ ...f, cadence: e.target.value as Draft['cadence'] }))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="daily">Quotidienne</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuelle</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Objet (template)</label>
          <Input
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="SCOOP — {{date}}"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Pré-en-tête (optionnel)</label>
          <Input
            value={form.preheader}
            onChange={(e) => setForm((f) => ({ ...f, preheader: e.target.value }))}
            placeholder="Aperçu dans la boîte mail"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Filtre segments (JSON) — ex. tags_any, status
          </label>
          <Textarea
            value={form.filterJson}
            onChange={(e) => setForm((f) => ({ ...f, filterJson: e.target.value }))}
            rows={3}
            className="font-mono text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Planifier (optionnel, fuseau local)
          </label>
          <Input
            type="datetime-local"
            value={form.sendAt}
            onChange={(e) => setForm((f) => ({ ...f, sendAt: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconPlus className="h-4 w-4" />}
          Créer
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
