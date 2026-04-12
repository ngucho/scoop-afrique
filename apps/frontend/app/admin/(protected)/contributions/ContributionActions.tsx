'use client'

import { useState, useTransition } from 'react'
import { IconCheck, IconX, IconTrash, IconLoader2, IconFlag } from '@tabler/icons-react'
import { ConfirmDialog } from 'scoop'
import { deleteReaderContribution, moderateReaderContribution } from '@/lib/admin/actions'

export function ContributionActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleApprove() {
    startTransition(async () => {
      await moderateReaderContribution(id, 'approved')
    })
  }

  function handleReject() {
    startTransition(async () => {
      await moderateReaderContribution(id, 'rejected')
    })
  }

  function handleSuspend() {
    startTransition(async () => {
      await moderateReaderContribution(id, 'suspended')
    })
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      await deleteReaderContribution(id)
    })
  }

  if (isPending) {
    return <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {status !== 'approved' && (
          <button
            type="button"
            onClick={handleApprove}
            title="Approuver"
            className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <IconCheck className="h-4 w-4" />
          </button>
        )}
        {status !== 'rejected' && status !== 'suspended' && (
          <button
            type="button"
            onClick={handleReject}
            title="Rejeter"
            className="rounded p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          >
            <IconX className="h-4 w-4" />
          </button>
        )}
        {(status === 'approved' || status === 'pending') && (
          <button
            type="button"
            onClick={handleSuspend}
            title="Suspendre (retrait du fil public)"
            className="rounded p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
          >
            <IconFlag className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          title="Supprimer"
          className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer la contribution"
        message="Supprimer définitivement cette entrée ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
