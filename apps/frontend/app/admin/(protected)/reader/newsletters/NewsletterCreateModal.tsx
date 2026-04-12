'use client'

import { useState } from 'react'
import { Button, Dialog } from 'scoop'
import { IconPlus } from '@tabler/icons-react'
import { NewsletterCampaignForm } from './NewsletterCampaignForm'

const DIALOG_FORM_CLASS = 'max-w-2xl w-full max-h-[90vh] overflow-y-auto'

export function NewsletterCreateModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-2 rounded-lg shrink-0">
        <IconPlus className="h-4 w-4" aria-hidden />
        Nouvelle campagne
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Nouvelle campagne newsletter"
        description="Création de campagne email"
        className={DIALOG_FORM_CLASS}
      >
        <NewsletterCampaignForm embedInModal onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  )
}
