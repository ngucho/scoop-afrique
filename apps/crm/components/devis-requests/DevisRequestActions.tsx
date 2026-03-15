'use client'

import { useRouter } from 'next/navigation'
import { Check, Trash2 } from 'lucide-react'
import { crmPatch, crmDelete } from '@/lib/api'
import { useState } from 'react'

interface DevisRequestActionsProps {
  id: string
  variant?: 'card' | 'detail'
}

export function DevisRequestActions({ id, variant = 'card' }: DevisRequestActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'treat' | 'delete' | null>(null)

  async function handleTreat() {
    setLoading('treat')
    const res = await crmPatch(`devis-requests/${id}`, { archived: true })
    setLoading(null)
    if (!('error' in res)) router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette demande ? Cette action est irréversible.')) return
    setLoading('delete')
    const res = await crmDelete(`devis-requests/${id}`)
    setLoading(null)
    if (!('error' in res)) router.push('/devis-requests')
    else alert(res.error)
  }

  const isCompact = variant === 'card'

  return (
    <div className={`flex items-center gap-1 ${isCompact ? '' : 'gap-2'}`}>
      <button
        type="button"
        onClick={handleTreat}
        disabled={!!loading}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 ${
          isCompact ? 'p-1.5' : 'px-3 py-2'
        }`}
        title="Marquer comme traité (sans créer contact/devis)"
      >
        <Check className="h-3.5 w-3.5" />
        {!isCompact && 'Marquer traité'}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={!!loading}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50 ${
          isCompact ? 'p-1.5' : 'px-3 py-2'
        }`}
        title="Supprimer la demande"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {!isCompact && 'Supprimer'}
      </button>
    </div>
  )
}
