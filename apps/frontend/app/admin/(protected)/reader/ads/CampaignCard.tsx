'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, Input } from 'scoop'
import type { AdCampaign, AdSlot } from '@/lib/api/types'
import {
  deleteAdCampaign,
  updateAdCampaign,
  upsertCreative,
  deleteCreative,
} from '@/lib/admin/actions'
import { IconLoader2, IconTrash } from '@tabler/icons-react'

export function CampaignCard({
  campaign,
  slots,
  statusLabels,
}: {
  campaign: AdCampaign
  slots: AdSlot[]
  statusLabels: Record<string, string>
}) {
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState(campaign.status)
  const [weight, setWeight] = useState(campaign.weight)
  const [headline, setHeadline] = useState('')
  const [linkUrl, setLinkUrl] = useState('https://')
  const slotLabel = slots.find((s) => s.id === campaign.slot_id)?.key ?? campaign.slot_id

  function saveMeta() {
    startTransition(async () => {
      try {
        await updateAdCampaign(campaign.id, { status, weight })
      } catch {
        alert('Erreur.')
      }
    })
  }

  function removeCampaign() {
    if (!confirm('Supprimer la campagne et ses créatives ? Action auditée.')) return
    startTransition(async () => {
      try {
        await deleteAdCampaign(campaign.id)
      } catch {
        alert('Erreur.')
      }
    })
  }

  function addCreative(e: React.FormEvent) {
    e.preventDefault()
    if (!headline.trim() || !linkUrl.trim()) return
    startTransition(async () => {
      try {
        await upsertCreative(campaign.id, {
          headline: headline.trim(),
          link_url: linkUrl.trim(),
          body: null,
          image_url: null,
          sort_order: campaign.creatives.length,
        })
        setHeadline('')
        setLinkUrl('https://')
      } catch {
        alert('Erreur.')
      }
    })
  }

  function removeCreative(id: string) {
    startTransition(async () => {
      try {
        await deleteCreative(campaign.id, id)
      } catch {
        alert('Erreur.')
      }
    })
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{slotLabel}</p>
            <h3 className="text-lg font-semibold">{campaign.name}</h3>
            <p className="text-xs text-muted-foreground">
              Créée {new Date(campaign.created_at).toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {Object.entries(statusLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Poids</label>
              <Input
                type="number"
                className="h-9 w-20"
                min={0}
                max={100}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </div>
            <button
              type="button"
              onClick={saveMeta}
              disabled={pending}
              className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={removeCampaign}
              disabled={pending}
              className="h-9 rounded-md border border-red-200 px-2 text-red-600 hover:bg-red-50 dark:border-red-900"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>
        </div>

        {campaign.creatives.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-3 py-2">Titre</th>
                  <th className="px-3 py-2">Lien</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {campaign.creatives.map((cr) => (
                  <tr key={cr.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 font-medium">{cr.headline}</td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-muted-foreground">{cr.link_url}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeCreative(cr.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={addCreative} className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Nouvelle créative — titre</label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Titre court" />
          </div>
          <div className="flex-[2]">
            <label className="mb-1 block text-xs text-muted-foreground">URL</label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} type="url" />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-md bg-secondary px-4 text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
          >
            Ajouter
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
