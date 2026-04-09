'use client'

import { useState, useTransition } from 'react'
import { Input } from 'scoop'
import { IconLoader2, IconPlus } from '@tabler/icons-react'
import type { AdSlot } from '@/lib/api/types'
import { createAdCampaign } from '@/lib/admin/actions'

export function AdCampaignForm({ slots }: { slots: AdSlot[] }) {
  const [name, setName] = useState('')
  const [slotId, setSlotId] = useState(slots[0]?.id ?? '')
  const [status, setStatus] = useState<'draft' | 'active' | 'paused' | 'ended'>('draft')
  const [weight, setWeight] = useState(1)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slotId) return
    startTransition(async () => {
      try {
        await createAdCampaign({
          slot_id: slotId,
          name: name.trim(),
          status,
          weight,
          start_at: null,
          end_at: null,
        })
        setName('')
      } catch {
        alert('Erreur.')
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">Nouvelle campagne</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nom</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Emplacement</label>
          <select
            value={slotId}
            onChange={(e) => setSlotId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Statut</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="draft">Brouillon</option>
            <option value="active">Actif</option>
            <option value="paused">Pause</option>
            <option value="ended">Terminé</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Pondération</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending || !slots.length}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconPlus className="h-4 w-4" />}
        Créer la campagne
      </button>
    </form>
  )
}
