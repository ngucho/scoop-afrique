'use client'

import { useState, useTransition } from 'react'
import { Input, Textarea } from 'scoop'
import { IconLoader2, IconPlus } from '@tabler/icons-react'
import { createNewsletterCampaign } from '@/lib/admin/actions'

export function NewsletterCampaignForm() {
  const [name, setName] = useState('')
  const [cadence, setCadence] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [subject, setSubject] = useState('')
  const [preheader, setPreheader] = useState('')
  const [filterJson, setFilterJson] = useState('{"tags_any": []}')
  const [sendAt, setSendAt] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !subject.trim()) return
    let segment_filter: Record<string, unknown>
    try {
      segment_filter = JSON.parse(filterJson) as Record<string, unknown>
    } catch {
      alert('Filtre segment (JSON) invalide.')
      return
    }
    startTransition(async () => {
      try {
        await createNewsletterCampaign({
          name: name.trim(),
          cadence,
          subject_template: subject.trim(),
          preheader: preheader.trim() || null,
          segment_filter,
          status: sendAt ? 'scheduled' : 'draft',
          send_at: sendAt ? new Date(sendAt).toISOString() : null,
        })
        setName('')
        setSubject('')
        setPreheader('')
        setSendAt('')
      } catch {
        alert('Erreur.')
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">Nouvelle campagne</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nom interne</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Cadence</label>
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value as typeof cadence)}
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
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="SCOOP — {{date}}"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Pré-en-tête (optionnel)</label>
          <Input
            value={preheader}
            onChange={(e) => setPreheader(e.target.value)}
            placeholder="Aperçu dans la boîte mail"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Filtre segments (JSON) — ex. tags_any, status
          </label>
          <Textarea value={filterJson} onChange={(e) => setFilterJson(e.target.value)} rows={3} className="font-mono text-xs" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Planifier (optionnel, fuseau local)
          </label>
          <Input
            type="datetime-local"
            value={sendAt}
            onChange={(e) => setSendAt(e.target.value)}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconPlus className="h-4 w-4" />}
        Créer
      </button>
    </form>
  )
}
