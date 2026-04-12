'use client'

import { useState } from 'react'
import { Button, Dialog } from 'scoop'
import { IconPlus } from '@tabler/icons-react'
import { AnnouncementForm } from './AnnouncementForm'

const DIALOG_FORM_CLASS = 'max-w-2xl w-full max-h-[90vh] overflow-y-auto'

export function AnnouncementCreateModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-2 rounded-lg shrink-0">
        <IconPlus className="h-4 w-4" aria-hidden />
        Nouvelle annonce
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Nouvelle annonce"
        description="Formulaire de création d’annonce reader"
        className={DIALOG_FORM_CLASS}
      >
        <AnnouncementForm embedInModal onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  )
}
