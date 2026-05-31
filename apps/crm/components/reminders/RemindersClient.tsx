'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Input } from 'scoop'
import { Bell, Pencil, X, MessageCircle, Copy } from 'lucide-react'
import type { CrmListViewMode } from '@/lib/crm-list-query'
import { NewReminderModal } from '@/components/reminders/NewReminderModal'
import { buildWaLink } from '@/lib/whatsapp'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  scheduled: 'Programmée',
  sent: 'Envoyée',
  replied: 'Réponse client',
  successful: 'Aboutie',
  closed: 'Fermée',
  cancelled: 'Annulée',
}

const STATUS_PILL: Record<string, string> = {
  draft: 'crm-pill crm-pill-draft',
  scheduled: 'crm-pill crm-pill-sent',
  sent: 'crm-pill crm-pill-confirmed',
  replied: 'crm-pill crm-pill-accepted',
  successful: 'crm-pill crm-pill-accepted',
  closed: 'crm-pill crm-pill-partial',
  cancelled: 'crm-pill crm-pill-draft opacity-70',
}

interface Reminder {
  id: string
  type: string
  message: string
  channel: string
  sent_at?: string
  scheduled_at?: string
  contact_id: string
  invoice_id?: string
  status?: string
}

interface RemindersClientProps {
  initialReminders: Array<Record<string, unknown>>
  initialTotal: number
  initialCounts: Record<string, number>
  contacts: Array<{ id: string; first_name?: string; last_name?: string; whatsapp?: string; phone?: string }>
  view?: CrmListViewMode
}

export function RemindersClient({
  initialReminders,
  initialTotal,
  initialCounts,
  contacts,
  view = 'list',
}: RemindersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') ?? ''

  const reminders: Reminder[] = useMemo(
    () =>
      initialReminders.map((r) => ({
        id: r.id as string,
        type: r.type as string,
        message: r.message as string,
        channel: r.channel as string,
        sent_at: r.sent_at as string | undefined,
        scheduled_at: r.scheduled_at as string | undefined,
        contact_id: r.contact_id as string,
        invoice_id: r.invoice_id as string | undefined,
        status: (r.status as string) ?? 'draft',
      })),
    [initialReminders]
  )

  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    message: '',
    type: 'invoice_overdue',
    channel: 'both',
    scheduled_at: '',
  })
  const [patching, setPatching] = useState<string | null>(null)

  function setFilter(status: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (status) p.set('status', status)
    else p.delete('status')
    router.replace(`/reminders?${p.toString()}`)
  }

  const contactName = (id: string) => {
    const c = contacts.find((x) => x.id === id)
    if (!c) return id
    return `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || id
  }

  const contactWaLink = (id: string, message: string) => {
    const c = contacts.find((x) => x.id === id)
    const phone = c?.whatsapp ?? c?.phone
    if (!phone) return null
    return buildWaLink(phone, message)
  }

  function copyMessage(message: string) {
    navigator.clipboard.writeText(message).then(() => toast.success('Message copié !')).catch(() => toast.error('Copie impossible'))
  }

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

  async function patchStatus(id: string, status: string) {
    setPatching(id)
    const res = await fetch(`/api/crm/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      credentials: 'include',
    })
    setPatching(null)
    if (res.ok) {
      toast.success('Statut mis à jour')
      router.refresh()
    } else {
      const json = await res.json()
      toast.error(json.error ?? 'Erreur')
    }
  }

  async function saveEdit(id: string) {
    if (!editForm.message.trim()) {
      toast.error('Message requis')
      return
    }
    setPatching(id)
    const res = await fetch(`/api/crm/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: editForm.message.trim(),
        type: editForm.type,
        channel: editForm.channel,
        scheduled_at: editForm.scheduled_at || null,
      }),
      credentials: 'include',
    })
    setPatching(null)
    if (res.ok) {
      toast.success('Relance mise à jour')
      setEditingId(null)
      router.refresh()
    } else {
      const json = await res.json()
      toast.error(json.error ?? 'Erreur')
    }
  }

  function openEdit(r: Reminder) {
    setEditingId(r.id)
    setEditForm({
      message: r.message,
      type: r.type,
      channel: r.channel,
      scheduled_at: r.scheduled_at ? r.scheduled_at.slice(0, 16) : '',
    })
  }

  const totalAll = useMemo(() => {
    return Object.values(initialCounts).reduce((a, b) => a + b, 0)
  }, [initialCounts])

  return (
    <div className="space-y-6 max-w-[1200px] crm-fade-in">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setFilter('')}
          className={`crm-card p-4 text-left transition-all ${!statusFilter ? 'ring-2 ring-primary' : 'crm-card-interactive'}`}
        >
          <p className="text-xs text-muted-foreground font-medium">Total relances</p>
          <p className="text-2xl font-bold tabular-nums">{totalAll}</p>
          <p className="text-xs text-muted-foreground mt-1">Tous statuts</p>
        </button>
        {(['draft', 'scheduled', 'sent', 'replied', 'successful', 'closed', 'cancelled'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilter(st)}
            className={`crm-card p-4 text-left transition-all ${statusFilter === st ? 'ring-2 ring-primary' : 'crm-card-interactive'}`}
          >
            <p className="text-xs text-muted-foreground font-medium">{STATUS_LABELS[st]}</p>
            <p className="text-2xl font-bold tabular-nums">{initialCounts[st] ?? 0}</p>
          </button>
        ))}
      </div>

      <div className="crm-page-header">
        <div>
          <p className="crm-page-subtitle">
            {initialTotal} affichée{initialTotal !== 1 ? 's' : ''}
            {statusFilter ? ` · filtre « ${STATUS_LABELS[statusFilter] ?? statusFilter} »` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex h-11 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Button type="button" onClick={() => setReminderModalOpen(true)} className="rounded-full">
          <Bell className="h-4 w-4 mr-2" />
          Nouvelle relance
        </Button>
        <NewReminderModal open={reminderModalOpen} onOpenChange={setReminderModalOpen} contacts={contacts} />
      </div>

      <div className="crm-card overflow-hidden">
        {view === 'cards' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 p-4">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-border p-4 space-y-2 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={STATUS_PILL[r.status ?? 'draft'] ?? STATUS_PILL.draft}>
                    {STATUS_LABELS[r.status ?? 'draft'] ?? r.status}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">{r.channel}</span>
                </div>
                <p className="font-medium">{contactName(r.contact_id)}</p>
                <p className="text-xs text-muted-foreground">{String(r.type ?? '')}</p>
                {editingId === r.id ? (
                  <textarea
                    value={editForm.message}
                    onChange={(e) => setEditForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full min-h-[72px] rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                ) : (
                  <p className="line-clamp-3 text-muted-foreground">{r.message}</p>
                )}
                <div className="flex flex-wrap gap-1 pt-2 justify-end">
                  {editingId === r.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={patching === r.id}
                        onClick={() => saveEdit(r.id)}
                      >
                        Enregistrer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => openEdit(r)} title="Modifier">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      {!r.sent_at && ['draft', 'scheduled'].includes(r.status ?? '') && (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={sending === r.id}
                          onClick={() => handleSend(r.id)}
                        >
                          {sending === r.id ? '…' : 'Envoyer'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Statut</th>
                <th>Contact</th>
                <th>Type</th>
                <th className="min-w-[200px]">Message</th>
                <th>Canal</th>
                <th>Programmé</th>
                <th>Envoyé</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className={STATUS_PILL[r.status ?? 'draft'] ?? STATUS_PILL.draft}>
                      {STATUS_LABELS[r.status ?? 'draft'] ?? r.status}
                    </span>
                  </td>
                  <td className="text-sm">{contactName(r.contact_id)}</td>
                  <td className="text-sm">{String(r.type ?? '—')}</td>
                  <td className="text-sm max-w-xs">
                    {editingId === r.id ? (
                      <textarea
                        value={editForm.message}
                        onChange={(e) => setEditForm((f) => ({ ...f, message: e.target.value }))}
                        className="w-full min-h-[72px] rounded-md border border-input bg-background px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="line-clamp-2">{r.message}</span>
                    )}
                  </td>
                  <td className="text-sm capitalize">{String(r.channel ?? '—')}</td>
                  <td className="text-sm text-muted-foreground">
                    {editingId === r.id ? (
                      <Input
                        type="datetime-local"
                        value={editForm.scheduled_at}
                        onChange={(e) => setEditForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                        className="h-9"
                      />
                    ) : r.scheduled_at ? (
                      new Date(r.scheduled_at).toLocaleString('fr-FR')
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-sm text-muted-foreground">
                    {r.sent_at ? new Date(r.sent_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="text-right">
                    <div className="flex flex-wrap gap-1 justify-end">
                      {editingId === r.id ? (
                        <>
                          <div className="w-full flex flex-wrap gap-1 mb-1">
                            <select
                              value={editForm.type}
                              onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                              className="h-8 rounded border border-input text-xs px-1 max-w-[140px]"
                            >
                              <option value="invoice_overdue">Facture retard</option>
                              <option value="invoice_follow_up">Facture — solde</option>
                              <option value="devis_follow_up">Suivi devis</option>
                              <option value="project_update">Projet</option>
                              <option value="custom">Perso</option>
                            </select>
                            <select
                              value={editForm.channel}
                              onChange={(e) => setEditForm((f) => ({ ...f, channel: e.target.value }))}
                              className="h-8 rounded border border-input text-xs px-1"
                            >
                              <option value="email">Email</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="both">Les deux</option>
                            </select>
                          </div>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={patching === r.id}
                            onClick={() => saveEdit(r.id)}
                          >
                            Enregistrer
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openEdit(r)} title="Modifier">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          {/* WhatsApp wa.me direct */}
                          {(() => {
                            const waLink = contactWaLink(r.contact_id, r.message)
                            return waLink ? (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ouvrir dans WhatsApp"
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[#25D366]/50 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            ) : null
                          })()}
                          {/* Copy message */}
                          <button
                            type="button"
                            title="Copier le message"
                            onClick={() => copyMessage(r.message)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          {!r.sent_at && ['draft', 'scheduled'].includes(r.status ?? '') && (
                            <Button
                              size="sm"
                              variant="default"
                              disabled={sending === r.id}
                              onClick={() => handleSend(r.id)}
                            >
                              {sending === r.id ? '…' : 'Envoyer'}
                            </Button>
                          )}
                          {r.sent_at && !['closed', 'cancelled', 'successful'].includes(r.status ?? '') && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={patching === r.id}
                                onClick={() => patchStatus(r.id, 'replied')}
                              >
                                Répondu
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={patching === r.id}
                                onClick={() => patchStatus(r.id, 'successful')}
                              >
                                Aboutie
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={patching === r.id}
                                onClick={() => patchStatus(r.id, 'closed')}
                              >
                                Fermer
                              </Button>
                            </>
                          )}
                          {!['cancelled', 'closed'].includes(r.status ?? '') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              disabled={patching === r.id}
                              onClick={() => patchStatus(r.id, 'cancelled')}
                            >
                              Annuler
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {reminders.length === 0 && (
        <p className="text-center text-muted-foreground py-12 crm-card">Aucune relance pour ce filtre.</p>
      )}
    </div>
  )
}
