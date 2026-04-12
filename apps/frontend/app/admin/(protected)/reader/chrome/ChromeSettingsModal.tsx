'use client'

import { useState } from 'react'
import { Button, Dialog } from 'scoop'
import { IconPencil } from '@tabler/icons-react'
import type { ReaderChromeSettings } from '@/lib/api/types'
import { ChromeSettingsForm } from './ChromeSettingsForm'

const DIALOG_FORM_CLASS = 'max-w-xl w-full max-h-[90vh] overflow-y-auto'

export function ChromeSettingsModal({ initial }: { initial: ReaderChromeSettings | null }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2 rounded-lg shrink-0">
        <IconPencil className="h-4 w-4" aria-hidden />
        Éditer les textes
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Message emplacements pub vides"
        description="Personnalisation des textes reader"
        className={DIALOG_FORM_CLASS}
      >
        <ChromeSettingsForm initial={initial} embedInModal onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  )
}
