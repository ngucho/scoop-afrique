'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Dialog, Input, Label, Textarea } from 'scoop'
import { MessageCircle, Mail } from 'lucide-react'
import {
  buildReminderTemplate,
  type ReminderChannel,
  type ReminderTypeKey,
} from '@/lib/reminder-message-templates'

export type FollowUpSuggestion = {
  key: string
  source: 'devis' | 'invoice'
  entity_id: string
  contact_id: string
  first_name: string
  last_name: string
  company: string | null
  reference: string
  label: string
  suggested_type: 'devis_follow_up' | 'invoice_overdue' | 'invoice_follow_up'
  invoice_id?: string
  devis_id?: string
  total_fcfa: number
}

type ContactOpt = { id: string; first_name?: string; last_name?: string }

const TYPE_OPTIONS: { value: ReminderTypeKey; label: string }[] = [
  { value: 'devis_follow_up', label: 'Relance devis' },
  { value: 'invoice_follow_up', label: 'Facture — solde à régler' },
  { value: 'invoice_overdue', label: 'Facture en retard' },
  { value: 'project_update', label: 'Point projet' },
  { value: 'custom', label: 'Personnalisé' },
]

function contactLabel(c: ContactOpt) {
  return `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.id
}

function firstNameFromContact(contacts: ContactOpt[], id: string): string {
  const c = contacts.find((x) => x.id === id)
  return (c?.first_name ?? '').trim()
}

export function NewReminderModal({
  open,
  onOpenChange,
  contacts,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contacts: ContactOpt[]
}) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<FollowUpSuggestion[]>([])
  const [loadingSug, setLoadingSug] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [contactId, setContactId] = useState('')
  const [invoiceId, setInvoiceId] = useState<string | undefined>(undefined)
  const [type, setType] = useState<ReminderTypeKey>('devis_follow_up')
  const [channel, setChannel] = useState<ReminderChannel>('whatsapp')
  const [message, setMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [templateCtx, setTemplateCtx] = useState<{ reference?: string; montantFcfa?: number } | undefined>()

  useEffect(() => {
    if (!open) return
    setLoadingSug(true)
    fetch('/api/crm/reminders/follow-up-suggestions', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        const list = j?.data?.suggestions
        setSuggestions(Array.isArray(list) ? list : [])
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSug(false))
  }, [open])

  function resetForm() {
    setContactId('')
    setInvoiceId(undefined)
    setType('devis_follow_up')
    setChannel('whatsapp')
    setMessage('')
    setScheduledAt('')
    setTemplateCtx(undefined)
  }

  useEffect(() => {
    if (!open) resetForm()
  }, [open])

  function selectSuggestion(s: FollowUpSuggestion) {
    setContactId(s.contact_id)
    setInvoiceId(s.invoice_id)
    setType(s.suggested_type as ReminderTypeKey)
    const ctx = { reference: s.reference, montantFcfa: s.total_fcfa }
    setTemplateCtx(ctx)
    const prenom = (s.first_name ?? '').trim()
    const ch = channel === 'both' ? 'whatsapp' : channel
    setMessage(buildReminderTemplate(s.suggested_type as ReminderTypeKey, ch, prenom, ctx))
  }

  function onChangeContact(id: string) {
    setContactId(id)
    setInvoiceId(undefined)
    setTemplateCtx(undefined)
    const prenom = firstNameFromContact(contacts, id)
    const ch = channel === 'both' ? 'whatsapp' : channel
    setMessage(buildReminderTemplate(type, ch, prenom, undefined))
  }

  async function handleCreate() {
    if (!contactId || !message.trim()) {
      toast.error('Contact et message requis')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/crm/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: contactId,
        invoice_id: invoiceId,
        type,
        channel,
        message: message.trim(),
        scheduled_at: scheduledAt || undefined,
      }),
      credentials: 'include',
    })
    setSubmitting(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast.error((json as { error?: string }).error ?? 'Erreur')
      return
    }
    toast.success('Relance créée')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouvelle relance"
      className="max-w-lg max-h-[90vh] overflow-y-auto"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={submitting} onClick={handleCreate}>
            {submitting ? 'Création…' : 'Créer la relance'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground text-xs">
          Les suggestions listent les devis envoyés (sans réponse) et les factures non soldées. Le canal par défaut
          est WhatsApp Business ; le message est prérempli selon le type et le canal.
        </p>

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Suggestions</Label>
          <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border">
            {loadingSug ? (
              <p className="p-3 text-muted-foreground text-xs">Chargement…</p>
            ) : suggestions.length === 0 ? (
              <p className="p-3 text-muted-foreground text-xs">Aucune suggestion pour le moment.</p>
            ) : (
              suggestions.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground">
                    {s.first_name} {s.last_name}
                    {s.company ? (
                      <span className="text-muted-foreground font-normal"> · {s.company}</span>
                    ) : null}
                  </span>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="rel-contact">Contact</Label>
          <select
            id="rel-contact"
            value={contactId}
            onChange={(e) => onChangeContact(e.target.value)}
            className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Choisir un contact —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {contactLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="rel-type">Type de relance</Label>
            <select
              id="rel-type"
              value={type}
              onChange={(e) => {
                const v = e.target.value as ReminderTypeKey
                setType(v)
                const prenom = firstNameFromContact(contacts, contactId)
                const ch = channel === 'both' ? 'whatsapp' : channel
                setMessage(buildReminderTemplate(v, ch, prenom, templateCtx))
              }}
              className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="rel-channel">Canal</Label>
            <select
              id="rel-channel"
              value={channel}
              onChange={(e) => {
                const v = e.target.value as ReminderChannel
                setChannel(v)
                const prenom = firstNameFromContact(contacts, contactId)
                const ch = v === 'both' ? 'whatsapp' : v
                setMessage(buildReminderTemplate(type, ch, prenom, templateCtx))
              }}
              className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="whatsapp">WhatsApp Business (recommandé)</option>
              <option value="email">Email</option>
              <option value="both">Email + WhatsApp</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="rel-msg">Message</Label>
          <Textarea
            id="rel-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="mt-1 min-h-[140px] text-sm"
            placeholder="Le texte s’adapte au type et au canal…"
          />
          <p className="text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-2 items-center">
            <MessageCircle className="h-3 w-3" /> WhatsApp : ton court
            <span className="opacity-50">·</span>
            <Mail className="h-3 w-3" /> Email : formule plus détaillée
          </p>
        </div>

        <div>
          <Label htmlFor="rel-sched">Programmer (optionnel)</Label>
          <Input
            id="rel-sched"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </Dialog>
  )
}
