'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Input, Label } from 'scoop'
import { MetricsForm } from './MetricsForm'

const DELIVERABLE_TYPES = [
  { value: 'video_short', label: 'Vidéo courte' },
  { value: 'video_long', label: 'Vidéo longue' },
  { value: 'post', label: 'Post' },
  { value: 'story', label: 'Story' },
  { value: 'article', label: 'Article' },
  { value: 'recap', label: 'Récap' },
  { value: 'report', label: 'Rapport' },
  { value: 'other', label: 'Autre' },
]

const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'threads', label: 'Threads' },
  { value: 'website', label: 'Site web' },
  { value: 'other', label: 'Autre' },
]

interface Deliverable {
  id: string
  title: string
  type: string
  platform: string
  url?: string
  published_at?: string
}

export function DeliverablesList({
  projectId,
  initialDeliverables,
}: {
  projectId: string
  initialDeliverables: Array<Record<string, unknown>>
}) {
  const router = useRouter()
  const [deliverables, setDeliverables] = useState<Deliverable[]>(
    initialDeliverables.map((d) => ({
      id: d.id as string,
      title: d.title as string,
      type: d.type as string,
      platform: d.platform as string,
      url: d.url as string,
      published_at: d.published_at as string,
    }))
  )
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('post')
  const [newPlatform, setNewPlatform] = useState('instagram')
  const [metricsFor, setMetricsFor] = useState<string | null>(null)

  async function addDeliverable() {
    if (!newTitle.trim()) return
    const res = await fetch(`/api/crm/projects/${projectId}/deliverables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(),
        type: newType,
        platform: newPlatform,
      }),
      credentials: 'include',
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error((json as { error?: string }).error ?? 'Erreur')
      return
    }
    toast.success('Livrable créé')
    setDeliverables((prev) => [
      ...prev,
      {
        id: json.data.id,
        title: json.data.title,
        type: json.data.type,
        platform: json.data.platform,
      },
    ])
    setNewTitle('')
    setShowForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        {showForm ? (
          <div className="rounded-lg border border-border p-4 space-y-3 max-w-md">
            <div>
              <Label>Titre</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Post Instagram campagne X"
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {DELIVERABLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Plateforme</Label>
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={addDeliverable}>Ajouter</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowForm(true)}>+ Livrable</Button>
        )}
      </div>

      <div className="space-y-4">
        {deliverables.map((d) => (
          <div
            key={d.id}
            className="rounded-lg border border-border p-4 flex justify-between items-start"
          >
            <div>
              <p className="font-medium">{d.title}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {d.type.replace('_', ' ')} • {d.platform}
              </p>
              {d.url && (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {d.url}
                </a>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMetricsFor(metricsFor === d.id ? null : d.id)}
            >
              {metricsFor === d.id ? 'Fermer' : 'Métriques'}
            </Button>
          </div>
        ))}
      </div>

      {metricsFor && (
        <MetricsForm
          deliverableId={metricsFor}
          onClose={() => setMetricsFor(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  )
}
