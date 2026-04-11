'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { AdminFormSection, Button, Input, Label, Select, Textarea } from 'scoop'
import type { NewsletterCampaignRow } from '@/lib/api/types'
import { updateNewsletterCampaign } from '@/lib/admin/actions'
import { NewsletterHtmlEditor } from '@/components/admin/NewsletterHtmlEditor'
import { ArrowLeft, Save } from 'lucide-react'

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function NewsletterCampaignEditor({ initial }: { initial: NewsletterCampaignRow }) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(initial.name)
  const [cadence, setCadence] = useState(initial.cadence)
  const [subject, setSubject] = useState(initial.subject_template)
  const [preheader, setPreheader] = useState(initial.preheader ?? '')
  const [bodyHtml, setBodyHtml] = useState(initial.body_html ?? '<p></p>')
  const [status, setStatus] = useState(initial.status)
  const [filterJson, setFilterJson] = useState(JSON.stringify(initial.segment_filter ?? {}, null, 2))
  const [sendAt, setSendAt] = useState(
    initial.send_at ? initial.send_at.slice(0, 16) : '',
  )

  const newsletterPreviewSrcDoc = useMemo(() => {
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{margin:0;padding:16px;font:15px/1.5 system-ui,-apple-system,sans-serif;background:#fafafa;color:#111} .meta{border-bottom:1px solid #e5e5e5;padding-bottom:12px;margin-bottom:16px}.ph{color:#666;font-size:13px;margin-top:4px;white-space:pre-wrap}</style></head><body><div class="meta"><strong>Objet :</strong> ${escapeHtml(subject)}<div class="ph">${escapeHtml(preheader)}</div></div>${bodyHtml}</body></html>`
  }, [subject, preheader, bodyHtml])

  function save() {
    let segment_filter: Record<string, unknown>
    try {
      segment_filter = JSON.parse(filterJson) as Record<string, unknown>
    } catch {
      alert('Filtre segment (JSON) invalide.')
      return
    }
    startTransition(async () => {
      try {
        await updateNewsletterCampaign(initial.id, {
          name: name.trim(),
          cadence,
          subject_template: subject.trim(),
          preheader: preheader.trim() || null,
          body_html: bodyHtml,
          segment_filter,
          status,
          send_at: sendAt ? new Date(sendAt).toISOString() : null,
        })
      } catch {
        alert('Erreur.')
      }
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2 rounded-lg" asChild>
          <Link href="/admin/reader/newsletters">
            <ArrowLeft className="h-4 w-4" />
            Campagnes
          </Link>
        </Button>
      </div>

      <AdminFormSection title={name || 'Campagne newsletter'} description="Objet, pré-en-tête (preheader), corps HTML, segmentation et planification.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              Nom interne
            </Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Cadence
            </Label>
            <Select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as typeof cadence)}
              className="h-10"
              options={[
                { value: 'daily', label: 'Quotidienne' },
                { value: 'weekly', label: 'Hebdomadaire' },
                { value: 'monthly', label: 'Mensuelle' },
              ]}
            />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Statut
            </Label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="h-10"
              options={[
                { value: 'draft', label: 'Brouillon' },
                { value: 'scheduled', label: 'Planifiée' },
                { value: 'sending', label: 'Envoi en cours' },
                { value: 'sent', label: 'Envoyée' },
                { value: 'cancelled', label: 'Annulée' },
              ]}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              Objet (ligne d’objet dans la boîte mail)
            </Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              Pré-en-tête (preheader) — aperçu après l’objet, ~40–130 caractères recommandés
            </Label>
            <Input
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="Résumé incitatif visible dans l’aperçu du mail…"
              maxLength={200}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              Corps de l’e-mail
            </Label>
            <NewsletterHtmlEditor html={bodyHtml} onChange={setBodyHtml} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              Aperçu HTML (rendu approximatif dans la boîte mail)
            </Label>
            <iframe
              title="Aperçu newsletter"
              className="h-[min(480px,70vh)] w-full rounded-lg border border-border bg-white shadow-sm"
              sandbox=""
              srcDoc={newsletterPreviewSrcDoc}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label size="sm" className="text-muted-foreground">
              Filtre segments (JSON) — ex. tags sur abonnés
            </Label>
            <Textarea value={filterJson} onChange={(e) => setFilterJson(e.target.value)} rows={4} className="font-mono text-xs" />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Planifier l’envoi (optionnel)
            </Label>
            <Input type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} />
          </div>
        </div>
        <Button type="button" onClick={save} loading={pending} className="mt-4 gap-2 rounded-lg">
          <Save className="h-4 w-4" />
          Enregistrer
        </Button>
      </AdminFormSection>
    </div>
  )
}
