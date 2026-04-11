'use client'

import { useState, useTransition } from 'react'
import {
  Card,
  CardContent,
  Input,
  Select,
  Button,
  Label,
  AdminTable,
  AdSlotFrame,
  AdCreativeDisplay,
} from 'scoop'
import { Trash2 } from 'lucide-react'
import type { AdCampaign, AdCreative, AdSlot } from '@/lib/api/types'
import {
  deleteAdCampaign,
  updateAdCampaign,
  upsertCreative,
  deleteCreative,
} from '@/lib/admin/actions'
import { adCampaignVisibleOnSite, adScheduleHintFr, assertAdDateOrder } from '@/lib/adSchedule'

function toCreativeDisplay(cr: AdCreative) {
  return {
    format: cr.format,
    headline: cr.headline,
    body: cr.body,
    image_url: cr.image_url,
    link_url: cr.link_url,
    cta_label: cr.cta_label,
    video_url: cr.video_url,
    alt: cr.alt,
  }
}

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const FORMATS: { id: NonNullable<AdCreative['format']>; label: string }[] = [
  { id: 'native', label: 'Native (texte + image + CTA)' },
  { id: 'image', label: 'Image / bannière' },
  { id: 'video', label: 'Vidéo (YouTube + CTA)' },
]

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
  const [startAt, setStartAt] = useState(isoToDatetimeLocal(campaign.start_at))
  const [endAt, setEndAt] = useState(isoToDatetimeLocal(campaign.end_at))
  const [headline, setHeadline] = useState('')
  const [body, setBody] = useState('')
  const [linkUrl, setLinkUrl] = useState('https://')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [alt, setAlt] = useState('')
  const [format, setFormat] = useState<NonNullable<AdCreative['format']>>('native')
  const [creativeWeight, setCreativeWeight] = useState(1)
  const slotLabel = slots.find((s) => s.id === campaign.slot_id)?.key ?? campaign.slot_id

  const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
    value,
    label,
  }))

  function saveMeta() {
    const err = assertAdDateOrder(startAt, endAt)
    if (err) {
      alert(err)
      return
    }
    startTransition(async () => {
      try {
        await updateAdCampaign(campaign.id, {
          status,
          weight,
          start_at: startAt ? new Date(startAt).toISOString() : null,
          end_at: endAt ? new Date(endAt).toISOString() : null,
        })
      } catch {
        alert('Erreur.')
      }
    })
  }

  const previewStartIso = startAt ? new Date(startAt).toISOString() : null
  const previewEndIso = endAt ? new Date(endAt).toISOString() : null
  const liveHint = adScheduleHintFr(status, previewStartIso, previewEndIso)
  const visibleNow = adCampaignVisibleOnSite(status, previewStartIso, previewEndIso)

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
          body: body.trim() || null,
          image_url: imageUrl.trim() || null,
          video_url: videoUrl.trim() || null,
          cta_label: ctaLabel.trim() || null,
          alt: alt.trim() || null,
          format,
          weight: creativeWeight,
          sort_order: campaign.creatives.length,
        })
        setHeadline('')
        setBody('')
        setLinkUrl('https://')
        setImageUrl('')
        setVideoUrl('')
        setCtaLabel('')
        setAlt('')
        setFormat('native')
        setCreativeWeight(1)
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
            <p className="mt-1 text-xs text-muted-foreground">
              Fenêtre :{' '}
              {campaign.start_at
                ? new Date(campaign.start_at).toLocaleString('fr-FR')
                : 'dès activation'}
              {' → '}
              {campaign.end_at ? new Date(campaign.end_at).toLocaleString('fr-FR') : 'sans fin'}
            </p>
            <p
              className={`mt-2 rounded-md border px-2 py-1.5 text-xs ${
                visibleNow
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100'
              }`}
            >
              {liveHint}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label size="sm" className="text-muted-foreground">
                Statut
              </Label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                options={statusOptions}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label size="sm" className="text-muted-foreground">
                Poids campagne
              </Label>
              <Input
                type="number"
                className="h-9 w-20"
                min={0}
                max={100}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label size="sm" className="text-muted-foreground">
                Début
              </Label>
              <Input
                type="datetime-local"
                className="h-9 w-[200px]"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label size="sm" className="text-muted-foreground">
                Fin
              </Label>
              <Input
                type="datetime-local"
                className="h-9 w-[200px]"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={saveMeta}
              disabled={pending}
              loading={pending}
              size="sm"
              className="rounded-lg"
            >
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={removeCampaign}
              disabled={pending}
              className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
              title="Supprimer la campagne"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {campaign.creatives.length > 0 ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Aperçu affichage (reader)
            </p>
            <p className="text-xs text-muted-foreground">
              Rendu approximatif avec le même composant que sur le site ; cadre « Publicité » inclus.
            </p>
            <div className="flex flex-col gap-4">
              {campaign.creatives.map((cr) => (
                <div key={cr.id} className="max-w-xl">
                  <AdSlotFrame label="Publicité">
                    <AdCreativeDisplay creative={toCreativeDisplay(cr)} onLinkClick={() => {}} />
                  </AdSlotFrame>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {campaign.creatives.length > 0 ? (
          <AdminTable
            columns={[
              { label: 'Format' },
              { label: 'Titre' },
              { label: 'Lien' },
              { label: 'Action', align: 'right' },
            ]}
            rows={campaign.creatives.map((cr) => [
              <span className="font-mono text-xs">{cr.format ?? 'native'}</span>,
              <span className="font-medium">{cr.headline}</span>,
              <span className="max-w-[200px] truncate text-muted-foreground">{cr.link_url}</span>,
              <Button
                type="button"
                variant="text"
                size="sm"
                className="min-h-0 px-0 text-xs text-destructive hover:underline"
                onClick={() => removeCreative(cr.id)}
              >
                Retirer
              </Button>,
            ])}
          />
        ) : null}

        <form
          onSubmit={addCreative}
          className="grid gap-3 rounded-md border border-dashed border-border p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <Label size="sm" className="text-muted-foreground">
              Format créatif
            </Label>
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value as NonNullable<AdCreative['format']>)}
              options={FORMATS.map((f) => ({ value: f.id, label: f.label }))}
              className="h-10 max-w-md"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              Titre / accroche
            </Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Titre court" />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Poids créatif (A/B)
            </Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={creativeWeight}
              onChange={(e) => setCreativeWeight(Number(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <Label size="sm" className="text-muted-foreground">
              Corps (native)
            </Label>
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Texte secondaire optionnel" />
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              URL de destination
            </Label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} type="url" />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Libellé CTA
            </Label>
            <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Ex. Découvrir" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              Image (URL)
            </Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} type="url" placeholder="https://…" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              Vidéo YouTube (URL)
            </Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              type="url"
              placeholder="https://youtube.com/…"
            />
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <Label size="sm" className="text-muted-foreground">
              Texte alternatif (accessibilité)
            </Label>
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Description courte du visuel" />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={pending} variant="secondary" size="sm" className="rounded-lg">
              Ajouter la créative
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
