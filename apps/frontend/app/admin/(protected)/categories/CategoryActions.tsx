'use client'

import { useState } from 'react'
import { useTransition } from 'react'
import { IconTrash, IconLoader2 } from '@tabler/icons-react'
import { ConfirmDialog } from 'scoop'
import { deleteCategory } from '@/lib/admin/actions'

export function CategoryActions({ categoryId }: { categoryId: string }) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleDeleteClick() {
    setConfirmOpen(true)
  }

  function handleDeleteConfirm() {
    startTransition(() => deleteCategory(categoryId))
  }

  if (isPending) {
    return <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  }

  return (
    <>
      <button
        onClick={handleDeleteClick}
        title="Supprimer"
        className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        <IconTrash className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer la catégorie"
        message="Supprimer cette catégorie ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
