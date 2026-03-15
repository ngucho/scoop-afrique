'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button, Input, Label } from 'scoop'

const schema = z.object({
  views: z.coerce.number().int().min(0).optional(),
  likes: z.coerce.number().int().min(0).optional(),
  comments: z.coerce.number().int().min(0).optional(),
  shares: z.coerce.number().int().min(0).optional(),
  saves: z.coerce.number().int().min(0).optional(),
  reach: z.coerce.number().int().min(0).optional(),
  impressions: z.coerce.number().int().min(0).optional(),
  clicks: z.coerce.number().int().min(0).optional(),
  engagement_rate: z.coerce.number().min(0).max(100).optional(),
})

type FormData = z.infer<typeof schema>

export function MetricsForm({
  deliverableId,
  onClose,
  onSaved,
}: {
  deliverableId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {},
  })

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    const body = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v != null && (typeof v !== 'string' || v !== ''))
    )
    const res = await fetch(`/api/crm/deliverables/${deliverableId}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    setSubmitting(false)
    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error ?? 'Erreur')
      return
    }
    toast.success('Métriques enregistrées')
    onSaved()
    onClose()
  }

  return (
    <div className="rounded-lg border border-border p-6 bg-muted/20 max-w-md">
      <h3 className="font-medium mb-4">Enregistrer les métriques</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="views">Vues</Label>
            <Input id="views" type="number" min={0} {...register('views')} />
          </div>
          <div>
            <Label htmlFor="likes">Likes</Label>
            <Input id="likes" type="number" min={0} {...register('likes')} />
          </div>
          <div>
            <Label htmlFor="comments">Commentaires</Label>
            <Input id="comments" type="number" min={0} {...register('comments')} />
          </div>
          <div>
            <Label htmlFor="shares">Partages</Label>
            <Input id="shares" type="number" min={0} {...register('shares')} />
          </div>
          <div>
            <Label htmlFor="saves">Sauvegardes</Label>
            <Input id="saves" type="number" min={0} {...register('saves')} />
          </div>
          <div>
            <Label htmlFor="reach">Portée</Label>
            <Input id="reach" type="number" min={0} {...register('reach')} />
          </div>
          <div>
            <Label htmlFor="impressions">Impressions</Label>
            <Input id="impressions" type="number" min={0} {...register('impressions')} />
          </div>
          <div>
            <Label htmlFor="clicks">Clics</Label>
            <Input id="clicks" type="number" min={0} {...register('clicks')} />
          </div>
          <div>
            <Label htmlFor="engagement_rate">Taux d&apos;engagement (%)</Label>
            <Input
              id="engagement_rate"
              type="number"
              min={0}
              max={100}
              step={0.01}
              {...register('engagement_rate')}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </form>
    </div>
  )
}
