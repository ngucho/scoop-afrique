'use client'

import { useState, useTransition } from 'react'
import { Input } from 'scoop'
import type { NewsletterSubscriberRow } from '@/lib/api/types'
import { updateSubscriberSegments } from '@/lib/admin/actions'
import { IconLoader2 } from '@tabler/icons-react'

export function SubscriberRow({ subscriber }: { subscriber: NewsletterSubscriberRow }) {
  const [open, setOpen] = useState(false)
  const [tags, setTags] = useState(subscriber.segment_tags.join(', '))
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  function save() {
    const segment_tags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    if (!reason.trim()) {
      alert('Indiquez une raison pour la traçabilité (audit).')
      return
    }
    startTransition(async () => {
      try {
        await updateSubscriberSegments(subscriber.id, {
          segment_tags,
          reason: reason.trim(),
        })
        setReason('')
        setOpen(false)
      } catch {
        alert('Erreur.')
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-primary hover:underline"
      >
        Segments
      </button>
    )
  }

  return (
    <div className="ml-auto flex max-w-[min(100%,280px)] flex-col gap-2 text-left">
      <Input
        placeholder="tags séparés par virgules"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="text-xs"
      />
      <Input
        placeholder="Raison (obligatoire)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="text-xs"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
        >
          {pending && <IconLoader2 className="h-3 w-3 animate-spin" />}
          OK
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border px-2 py-1 text-xs">
          Annuler
        </button>
      </div>
    </div>
  )
}
