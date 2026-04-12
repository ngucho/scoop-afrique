'use client'

import { useState } from 'react'
import { Button, Dialog } from 'scoop'
import { IconPlus } from '@tabler/icons-react'
import type { AdSlot } from '@/lib/api/types'
import { AdCampaignForm } from './AdCampaignForm'

const DIALOG_FORM_CLASS = 'max-w-3xl w-full max-h-[90vh] overflow-y-auto'

export function AdCampaignCreateModal({ slots }: { slots: AdSlot[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!slots.length}
        className="gap-2 rounded-lg shrink-0"
      >
        <IconPlus className="h-4 w-4" aria-hidden />
        Nouvelle campagne
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Nouvelle campagne publicitaire"
        description="Création de campagne reader"
        className={DIALOG_FORM_CLASS}
      >
        <AdCampaignForm slots={slots} embedInModal onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  )
}
