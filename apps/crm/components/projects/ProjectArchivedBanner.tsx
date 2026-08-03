'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Archive } from 'lucide-react'
import { Button } from 'scoop'
import { useCrmCapabilities } from '@/components/auth/CrmCapabilitiesProvider'
import { CLOSURE_TYPE_LABELS, closureErrorMessage, type ClosureType } from '@/lib/project-closure'

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * État historique figé d'un dossier archivé.
 *
 * Aucune action de mutation n'est proposée ici : un dossier scellé ne se
 * restaure pas, il se prolonge par un nouveau projet lié.
 */
export function ProjectArchivedBanner({
  projectId,
  archivedAt,
  archiveReason,
  closureType,
  sealed,
}: {
  projectId: string
  archivedAt?: string | null
  archiveReason?: string | null
  closureType?: string | null
  /** Le dossier a bien été clôturé par l'assistant (et non archivé anciennement). */
  sealed: boolean
}) {
  const router = useRouter()
  const { canManage } = useCrmCapabilities()
  const [creating, setCreating] = useState(false)

  async function createFollowUp() {
    setCreating(true)
    const response = await fetch(`/api/crm/projects/${projectId}/create-follow-up`, {
      method: 'POST',
      credentials: 'include',
    })
    const json = (await response.json().catch(() => ({}))) as {
      data?: { id?: string }
      error?: string
      message?: string
    }
    setCreating(false)
    if (!response.ok || !json.data?.id) {
      toast.error(closureErrorMessage(json.error, json.message ?? 'Création impossible.'))
      return
    }
    toast.success('Nouveau projet créé.')
    router.push(`/projects/${json.data.id}`)
  }

  return (
    <section
      aria-label="Dossier archivé"
      className="crm-card space-y-3 border-l-4 border-l-muted-foreground p-5"
    >
      <div className="flex items-start gap-3">
        <Archive className="mt-0.5 h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Dossier archivé — lecture seule</h2>
          <p className="text-sm text-muted-foreground">
            Ce dossier est figé. Les documents, paiements et mouvements financiers restent
            consultables et téléchargeables, mais plus aucune modification n’est possible.
          </p>
        </div>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Archivé le</dt>
          <dd className="font-medium">{formatDate(archivedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Motif</dt>
          <dd className="font-medium">
            {closureType && closureType in CLOSURE_TYPE_LABELS
              ? CLOSURE_TYPE_LABELS[closureType as ClosureType]
              : '—'}
          </dd>
        </div>
        <div className="sm:col-span-3">
          <dt className="text-xs text-muted-foreground">Description</dt>
          <dd className="whitespace-pre-wrap">{archiveReason ?? '—'}</dd>
        </div>
      </dl>

      {sealed && canManage ? (
        <div>
          <Button variant="outline" onClick={createFollowUp} disabled={creating}>
            {creating ? 'Création…' : 'Créer un nouveau projet lié'}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Le nouveau projet reprend le client et le contexte, sans aucun document ni
            mouvement financier.
          </p>
        </div>
      ) : null}
    </section>
  )
}
