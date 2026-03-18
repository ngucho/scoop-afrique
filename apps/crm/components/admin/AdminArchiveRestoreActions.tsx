'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Archive, RotateCcw } from 'lucide-react'
import { crmDelete, crmPost } from '@/lib/api'

type ResourcePath =
  | 'contacts'
  | 'projects'
  | 'devis'
  | 'invoices'
  | 'contracts'

export function AdminArchiveRestoreActions({
  resource,
  id,
  isArchived,
  isAdmin,
}: {
  resource: ResourcePath
  id: string
  isArchived: boolean
  isAdmin: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isAdmin) return null

  async function handleArchive(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return

    const reason = prompt('Raison (optionnelle) ?')?.trim()
    if (!confirm('Supprimer = archiver ? (réversible par un admin)')) return

    setLoading(true)
    const res = await crmDelete(`${resource}/${id}`)
    setLoading(false)

    if ('error' in res && res.error) {
      toast.error(res.error)
      return
    }
    toast.success(reason ? `Archivé (${reason})` : 'Archivé')
    router.refresh()
  }

  async function handleRestore(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return

    const reason = prompt('Raison (optionnelle) ?')?.trim()
    if (!confirm('Restaurer cet élément ?')) return

    setLoading(true)
    const res = await crmPost(`${resource}/${id}/restore`, {})
    setLoading(false)

    if ('error' in res && res.error) {
      toast.error(res.error)
      return
    }
    toast.success(reason ? `Restauré (${reason})` : 'Restauré')
    router.refresh()
  }

  return isArchived ? (
    <button
      type="button"
      onClick={handleRestore}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      title="Restaurer (annuler l'archivage)"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Restaurer
    </button>
  ) : (
    <button
      type="button"
      onClick={handleArchive}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      title="Supprimer = archiver (réversible)"
    >
      <Archive className="h-3.5 w-3.5" />
      <span className="sr-only">Archiver</span>
      <span>Archiver</span>
    </button>
  )
}

