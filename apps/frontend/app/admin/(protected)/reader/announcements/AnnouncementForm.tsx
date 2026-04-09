'use client'

import { useState, useTransition } from 'react'
import { Input, Textarea } from 'scoop'
import { IconLoader2, IconPlus } from '@tabler/icons-react'
import { createAnnouncement } from '@/lib/admin/actions'

export function AnnouncementForm() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<'all' | 'subscribers' | 'guests'>('all')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    startTransition(async () => {
      try {
        await createAnnouncement({
          title: title.trim(),
          body: body.trim(),
          audience,
          is_active: true,
          starts_at: null,
          ends_at: null,
        })
        setTitle('')
        setBody('')
      } catch {
        alert('Erreur lors de la création.')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <p className="text-sm font-medium">Nouvelle annonce</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Titre</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as typeof audience)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">Tous les visiteurs</option>
            <option value="subscribers">Abonnés newsletter</option>
            <option value="guests">Non abonnés</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Message</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            required
            className="min-h-[100px]"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconPlus className="h-4 w-4" />}
        Créer (audité)
      </button>
    </form>
  )
}
