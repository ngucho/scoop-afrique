'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from 'scoop'
import { Play, Pause, RotateCcw } from 'lucide-react'

type Status =
  | 'draft'
  | 'confirmed'
  | 'in_progress'
  | 'paused'
  | 'review'
  | 'delivered'
  | 'closed'
  | 'cancelled'

export function ProjectStatusActions({ projectId, status }: { projectId: string; status: Status }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function setStatus(next: Status) {
    setLoading(true)
    const res = await fetch(`/api/crm/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
      credentials: 'include',
    })
    const json = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      toast.error(json.error ?? 'Impossible de mettre à jour le statut')
      return
    }
    toast.success('Statut mis à jour')
    router.refresh()
  }

  if (status === 'closed' || status === 'cancelled') {
    return null
  }

  const canStart = status === 'draft' || status === 'confirmed'
  const canPause =
    status === 'in_progress' || status === 'review' || status === 'confirmed'
  const canResume = status === 'paused'

  return (
    <div className="flex flex-wrap gap-2">
      {canStart && (
        <Button
          type="button"
          size="sm"
          className="rounded-full gap-1.5"
          disabled={loading}
          onClick={() => setStatus('in_progress')}
        >
          <Play className="h-3.5 w-3.5" />
          Démarrer le projet
        </Button>
      )}
      {canPause && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5"
          disabled={loading}
          onClick={() => setStatus('paused')}
        >
          <Pause className="h-3.5 w-3.5" />
          Mettre en pause
        </Button>
      )}
      {canResume && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full gap-1.5"
          disabled={loading}
          onClick={() => setStatus('in_progress')}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reprendre
        </Button>
      )}
    </div>
  )
}
