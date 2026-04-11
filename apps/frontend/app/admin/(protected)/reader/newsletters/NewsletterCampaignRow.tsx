'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { NewsletterCampaignRow as Row } from '@/lib/api/types'
import { deleteNewsletterCampaign, updateNewsletterCampaign } from '@/lib/admin/actions'
import { IconLoader2, IconTrash } from '@tabler/icons-react'

export function NewsletterCampaignRow({
  campaign,
  cadenceLabels,
  statusLabels,
}: {
  campaign: Row
  cadenceLabels: Record<string, string>
  statusLabels: Record<string, string>
}) {
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState(campaign.status)

  function saveStatus() {
    startTransition(async () => {
      try {
        await updateNewsletterCampaign(campaign.id, { status })
      } catch {
        alert('Erreur.')
      }
    })
  }

  function remove() {
    if (!confirm('Supprimer cette campagne ?')) return
    startTransition(async () => {
      try {
        await deleteNewsletterCampaign(campaign.id)
      } catch {
        alert('Erreur.')
      }
    })
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <p className="font-medium">{campaign.name}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{campaign.subject_template}</p>
        <Link
          href={`/admin/reader/newsletters/${campaign.id}`}
          className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
        >
          Éditer le contenu (WYSIWYG)
        </Link>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">{cadenceLabels[campaign.cadence] ?? campaign.cadence}</td>
      <td className="hidden px-4 py-3 md:table-cell">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Row['status'])}
          className="rounded border border-input bg-background px-2 py-1 text-xs"
        >
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </td>
      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
        {campaign.send_at ? new Date(campaign.send_at).toLocaleString('fr-FR') : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={saveStatus}
            disabled={pending}
            className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
          >
            {pending ? <IconLoader2 className="h-3 w-3 animate-spin" /> : 'MAJ'}
          </button>
          <button
            type="button"
            onClick={remove}
            className="rounded-md border border-red-200 p-1 text-red-600 hover:bg-red-50 dark:border-red-900"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
