'use client'

import { useState, useTransition } from 'react'
import { Button } from 'scoop'
import { IconLoader2, IconMailFast } from '@tabler/icons-react'
import { relaunchPendingSubscribers } from '@/lib/admin/actions'

export function PendingRelaunchButton({ pendingTotal }: { pendingTotal: number }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function run() {
    setMessage(null)
    startTransition(async () => {
      try {
        const result = await relaunchPendingSubscribers(Math.min(Math.max(pendingTotal, 1), 500))
        setMessage(`${result.sent} relance${result.sent > 1 ? 's' : ''} envoyee${result.sent > 1 ? 's' : ''}`)
      } catch {
        setMessage('Relance impossible pour le moment.')
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="button" onClick={run} disabled={pending || pendingTotal === 0} className="gap-2">
        {pending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconMailFast className="h-4 w-4" />}
        Relancer les attentes
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  )
}
