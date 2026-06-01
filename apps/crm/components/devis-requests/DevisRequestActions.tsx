'use client'

import { useRouter } from 'next/navigation'
import { Check, Trash2, RotateCcw } from 'lucide-react'
import { crmPatch, crmDelete } from '@/lib/api'
import { useState } from 'react'

interface DevisRequestActionsProps {
  id: string
  variant?: 'card' | 'detail'
  isAdmin?: boolean
  archived?: boolean
  convertedToDevisId?: string | null
  convertedToContactId?: string | null
}

export function DevisRequestActions({
  id,
  variant = 'card',
  isAdmin = false,
  archived = false,
  convertedToDevisId = null,
  convertedToContactId = null,
}: DevisRequestActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'treat' | 'restore' | 'delete' | null>(null)

  const isConverted = Boolean(convertedToDevisId || convertedToContactId)
  const isCompact = variant === 'card'

  async function handleTreat() {
    setLoading('treat')
    const res = await crmPatch(`devis-requests/${id}`, { archived: true })
    setLoading(null)
    if (!('error' in res)) router.refresh()
  }

  async function handleRestore() {
    setLoading('restore')
    const res = await crmPatch(`devis-requests/${id}`, { archived: false })
    setLoading(null)
    if (!('error' in res)) router.refresh()
  }

  async function handleDelete() {
    if (!isAdmin) return
    if (!confirm('Supprimer cette demande ? Cette action est irréversible.')) return
    setLoading('delete')
    const res = await crmDelete(`devis-requests/${id}`)
    setLoading(null)
    if (!('error' in res)) router.push('/devis-requests')
    else alert((res as { error: string }).error)
  }

  return (
    <div className={`flex items-center gap-1 ${isCompact ? '' : 'gap-2'}`}>
      {/* Restaurer — uniquement si archivé par erreur (pas converti) */}
      {archived && !isConverted && (
        <button
          type="button"
          onClick={handleRestore}
          disabled={!!loading}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-medium transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50 ${
            isCompact ? 'p-1.5 text-xs' : 'px-3 py-2 text-xs'
          }`}
          title="Restaurer dans À traiter"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {!isCompact && (loading === 'restore' ? 'Restauration…' : 'Restaurer')}
        </button>
      )}

      {/* Marquer traité — uniquement si pas encore archivé/traité */}
      {!archived && !isConverted && (
        <button
          type="button"
          onClick={handleTreat}
          disabled={!!loading}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-background text-muted-foreground font-medium transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 ${
            isCompact ? 'p-1.5 text-xs' : 'px-3 py-2 text-xs'
          }`}
          title="Marquer comme traité (archiver)"
        >
          <Check className="h-3.5 w-3.5" />
          {!isCompact && (loading === 'treat' ? 'En cours…' : 'Marquer traité')}
        </button>
      )}

      {/* Supprimer — admin seulement */}
      {isAdmin && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={!!loading}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-background text-destructive font-medium transition-colors hover:bg-destructive/10 disabled:opacity-50 ${
            isCompact ? 'p-1.5 text-xs' : 'px-3 py-2 text-xs'
          }`}
          title="Supprimer définitivement"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {!isCompact && (loading === 'delete' ? 'Suppression…' : 'Supprimer')}
        </button>
      )}
    </div>
  )
}
