'use client'

import { useCallback, useTransition } from 'react'
import { Input, Select, AdminFormSection, Button, Label } from 'scoop'
import { Plus } from 'lucide-react'
import type { AdSlot } from '@/lib/api/types'
import { createAdCampaign } from '@/lib/admin/actions'
import { assertAdDateOrder } from '@/lib/adSchedule'
import { useFormDraftState } from '@/hooks/useFormDraft'

type Draft = {
  name: string
  slotId: string
  status: 'draft' | 'active' | 'paused' | 'ended'
  weight: number
  startAt: string
  endAt: string
}

export function AdCampaignForm({ slots }: { slots: AdSlot[] }) {
  const getDefaults = useCallback((): Draft => {
    return {
      name: '',
      slotId: slots[0]?.id ?? '',
      status: 'draft',
      weight: 1,
      startAt: '',
      endAt: '',
    }
  }, [slots])

  const [form, setForm, clearDraft] = useFormDraftState('admin:reader:ads:new-campaign', getDefaults)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.slotId) return
    const dateErr = assertAdDateOrder(form.startAt, form.endAt)
    if (dateErr) {
      alert(dateErr)
      return
    }
    startTransition(async () => {
      try {
        await createAdCampaign({
          slot_id: form.slotId,
          name: form.name.trim(),
          status: form.status,
          weight: form.weight,
          start_at: form.startAt ? new Date(form.startAt).toISOString() : null,
          end_at: form.endAt ? new Date(form.endAt).toISOString() : null,
        })
        clearDraft()
      } catch {
        alert('Erreur.')
      }
    })
  }

  return (
    <AdminFormSection
      title="Nouvelle campagne"
      description="Choisissez l’emplacement (clé affichée sur le site), puis optionnellement une fenêtre de diffusion. Les campagnes actives hors plage ne s’affichent pas. Le brouillon est conservé sur cet appareil jusqu’à envoi réussi."
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              Nom interne
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Ex. Partenaire Q2"
            />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Emplacement
            </Label>
            <Select
              value={form.slotId}
              onChange={(e) => setForm((f) => ({ ...f, slotId: e.target.value }))}
              options={slots.map((s) => ({ value: s.id, label: `${s.label} (${s.key})` }))}
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Statut
            </Label>
            <Select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Draft['status'] }))}
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
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Début d’affichage (optionnel)
            </Label>
            <Input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Fin d’affichage (optionnel)
            </Label>
            <Input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            disabled={pending || !slots.length}
            loading={pending}
            className="gap-2 rounded-lg"
          >
            {!pending ? <Plus className="h-4 w-4" aria-hidden /> : null}
            Créer la campagne
          </Button>
          <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={clearDraft}>
            Effacer le brouillon
          </Button>
        </div>
      </form>
    </AdminFormSection>
  )
}
