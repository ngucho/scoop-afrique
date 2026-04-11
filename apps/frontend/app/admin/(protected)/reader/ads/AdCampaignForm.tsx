'use client'

import { useState, useTransition } from 'react'
import { Input, Select, AdminFormSection, Button, Label } from 'scoop'
import { Plus } from 'lucide-react'
import type { AdSlot } from '@/lib/api/types'
import { createAdCampaign } from '@/lib/admin/actions'
import { assertAdDateOrder } from '@/lib/adSchedule'

export function AdCampaignForm({ slots }: { slots: AdSlot[] }) {
  const [name, setName] = useState('')
  const [slotId, setSlotId] = useState(slots[0]?.id ?? '')
  const [status, setStatus] = useState<'draft' | 'active' | 'paused' | 'ended'>('draft')
  const [weight, setWeight] = useState(1)
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slotId) return
    const dateErr = assertAdDateOrder(startAt, endAt)
    if (dateErr) {
      alert(dateErr)
      return
    }
    startTransition(async () => {
      try {
        await createAdCampaign({
          slot_id: slotId,
          name: name.trim(),
          status,
          weight,
          start_at: startAt ? new Date(startAt).toISOString() : null,
          end_at: endAt ? new Date(endAt).toISOString() : null,
        })
        setName('')
        setStartAt('')
        setEndAt('')
      } catch {
        alert('Erreur.')
      }
    })
  }

  return (
    <AdminFormSection
      title="Nouvelle campagne"
      description="Choisissez l’emplacement (clé affichée sur le site), puis optionnellement une fenêtre de diffusion. Les campagnes actives hors plage ne s’affichent pas."
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              Nom interne
            </Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex. Partenaire Q2" />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Emplacement
            </Label>
            <Select
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              options={slots.map((s) => ({ value: s.id, label: `${s.label} (${s.key})` }))}
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Statut
            </Label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              options={[
                { value: 'draft', label: 'Brouillon' },
                { value: 'active', label: 'Actif' },
                { value: 'paused', label: 'Pause' },
                { value: 'ended', label: 'Terminé' },
              ]}
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Pondération (rotation)
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Début d’affichage (optionnel)
            </Label>
            <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Fin d’affichage (optionnel)
            </Label>
            <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>
        </div>
        <Button
          type="submit"
          disabled={pending || !slots.length}
          loading={pending}
          className="gap-2 rounded-lg"
        >
          {!pending ? <Plus className="h-4 w-4" aria-hidden /> : null}
          Créer la campagne
        </Button>
      </form>
    </AdminFormSection>
  )
}
