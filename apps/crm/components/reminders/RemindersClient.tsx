'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Input, Label } from 'scoop'

interface Reminder {
  id: string
  type: string
  message: string
  channel: string
  sent_at?: string
  contact_id: string
}

interface RemindersClientProps {
  initialReminders: Array<Record<string, unknown>>
  contacts: Array<{ id: string; first_name?: string; last_name?: string }>
}

export function RemindersClient({
  initialReminders,
  contacts,
}: RemindersClientProps) {
  const router = useRouter()
  const reminders: Reminder[] = initialReminders.map((r) => ({
    id: r.id as string,
    type: r.type as string,
    message: r.message as string,
    channel: r.channel as string,
    sent_at: r.sent_at as string,
    contact_id: r.contact_id as string,
  }))
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [form, setForm] = useState({
    contact_id: '',
    type: 'invoice_overdue',
    channel: 'both',
    message: '',
    scheduled_at: '',
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSend(reminderId: string) {
    setSending(reminderId)
    const res = await fetch(`/api/crm/reminders/${reminderId}/send`, {
      method: 'POST',
      credentials: 'include',
    })
    setSending(null)
    if (res.ok) {
      toast.success('Relance envoyée')
      router.refresh()
    } else {
      const json = await res.json()
      toast.error(json.error ?? 'Erreur')
    }
  }

  async function handleCreate() {
    if (!form.contact_id || !form.message.trim()) {
      toast.error('Contact et message requis')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/crm/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: form.contact_id,
        type: form.type,
        channel: form.channel,
        message: form.message.trim(),
        scheduled_at: form.scheduled_at || undefined,
      }),
      credentials: 'include',
    })
    setSubmitting(false)
    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error ?? 'Erreur')
      return
    }
    toast.success('Relance créée')
    setForm({ contact_id: '', type: 'invoice_overdue', channel: 'both', message: '', scheduled_at: '' })
    setShowForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        {showForm ? (
          <div className="rounded-lg border border-border p-4 max-w-md space-y-3">
            <h3 className="font-medium">Nouvelle relance</h3>
            <div>
              <Label>Contact</Label>
              <select
                value={form.contact_id}
                onChange={(e) => setForm((f) => ({ ...f, contact_id: e.target.value }))}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Sélectionner —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="invoice_overdue">Facture en retard</option>
                <option value="devis_follow_up">Suivi devis</option>
                <option value="project_update">Mise à jour projet</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>
            <div>
              <Label>Canal</Label>
              <select
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="both">Email + WhatsApp</option>
              </select>
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Message à envoyer..."
              />
            </div>
            <div>
              <Label>Programmé pour (optionnel)</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Création…' : 'Créer'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowForm(true)}>+ Relance</Button>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Message</th>
              <th className="text-left p-3 font-medium">Canal</th>
              <th className="text-left p-3 font-medium">Envoyé</th>
              <th className="text-left p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {reminders.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="p-3">{String(r.type ?? '—')}</td>
                <td className="p-3 max-w-xs truncate">{String(r.message ?? '—')}</td>
                <td className="p-3 capitalize">{String(r.channel ?? '—')}</td>
                <td className="p-3">
                  {r.sent_at
                    ? new Date(r.sent_at).toLocaleDateString('fr-FR')
                    : '—'}
                </td>
                <td className="p-3">
                  {!r.sent_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSend(r.id)}
                      disabled={sending === r.id}
                    >
                      {sending === r.id ? 'Envoi…' : 'Envoyer'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reminders.length === 0 && !showForm && (
        <p className="text-center text-muted-foreground py-12">
          Aucune relance.
        </p>
      )}
    </div>
  )
}
