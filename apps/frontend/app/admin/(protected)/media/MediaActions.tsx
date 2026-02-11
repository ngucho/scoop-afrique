'use client'

import { useState } from 'react'
import { useTransition } from 'react'
import { IconCopy, IconTrash, IconLoader2 } from '@tabler/icons-react'
import { ConfirmDialog } from 'scoop'
import { deleteMedia } from '@/lib/admin/actions'

export function MediaActions({ mediaId, url }: { mediaId: string; url: string }) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(url)
  }

  function handleDeleteClick() {
    setConfirmOpen(true)
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      await deleteMedia(mediaId)
    })
  }

  if (isPending) {
    return <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={handleCopy}
          title="Copier l'URL"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <IconCopy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDeleteClick}
          title="Supprimer"
          className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <IconTrash className="h-3.5 w-3.5" />
        </button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer le média"
        message="Supprimer ce média ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
