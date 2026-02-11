'use client'

import { useState } from 'react'
import { useTransition } from 'react'
import { IconCheck, IconX, IconTrash, IconLoader2 } from '@tabler/icons-react'
import { ConfirmDialog } from 'scoop'
import { moderateComment, deleteComment } from '@/lib/admin/actions'

export function CommentActions({
  commentId,
  status,
}: {
  commentId: string
  status: string
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleApprove() {
    startTransition(async () => { await moderateComment(commentId, 'approved') })
  }

  function handleReject() {
    startTransition(async () => { await moderateComment(commentId, 'rejected') })
  }

  function handleDeleteClick() {
    setConfirmOpen(true)
  }

  function handleDeleteConfirm() {
    startTransition(async () => { await deleteComment(commentId) })
  }

  if (isPending) {
    return <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {status !== 'approved' && (
          <button
            onClick={handleApprove}
            title="Approuver"
            className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <IconCheck className="h-4 w-4" />
          </button>
        )}
        {status !== 'rejected' && (
          <button
            onClick={handleReject}
            title="Rejeter"
            className="rounded p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          >
            <IconX className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={handleDeleteClick}
          title="Supprimer"
          className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer le commentaire"
        message="Supprimer ce commentaire ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
