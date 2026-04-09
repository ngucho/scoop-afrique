'use client'

import { useTransition } from 'react'
import type { ReaderAnnouncement } from '@/lib/api/types'
import { deleteAnnouncement, updateAnnouncement } from '@/lib/admin/actions'
import { IconTrash, IconToggleLeft, IconToggleRight, IconLoader2 } from '@tabler/icons-react'

export function AnnouncementRowActions({ announcement }: { announcement: ReaderAnnouncement }) {
  const [pending, startTransition] = useTransition()

  function toggleActive() {
    startTransition(async () => {
      try {
        await updateAnnouncement(announcement.id, { is_active: !announcement.is_active })
      } catch {
        alert('Erreur.')
      }
    })
  }

  function remove() {
    if (
      !confirm(
        'Supprimer cette annonce ? L’action sera enregistrée dans le journal d’audit.',
      )
    )
      return
    startTransition(async () => {
      try {
        await deleteAnnouncement(announcement.id)
      } catch {
        alert('Erreur.')
      }
    })
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={toggleActive}
        disabled={pending}
        title={announcement.is_active ? 'Désactiver' : 'Activer'}
        className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        {pending ? (
          <IconLoader2 className="h-4 w-4 animate-spin" />
        ) : announcement.is_active ? (
          <IconToggleRight className="h-4 w-4" />
        ) : (
          <IconToggleLeft className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
        title="Supprimer"
      >
        <IconTrash className="h-4 w-4" />
      </button>
    </div>
  )
}
