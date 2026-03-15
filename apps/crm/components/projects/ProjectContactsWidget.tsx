'use client'

import { useState } from 'react'
import Link from 'next/link'
import { crmPost, crmDelete } from '@/lib/api'
import { UserPlus, X, Star, Users } from 'lucide-react'

type Contact = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  company?: string
  type?: string
}

type ProjectContact = {
  id: string
  contact_id: string
  role: string
  is_primary: boolean
  contact?: Contact
}

const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  prospect: 'Prospect',
  partner: 'Partenaire',
  referral: 'Apporteur',
  other: 'Autre',
}

const ROLE_COLORS: Record<string, string> = {
  client: 'oklch(0.42 0.14 145)',
  prospect: 'oklch(0.42 0.16 260)',
  partner: 'oklch(0.42 0.14 200)',
  referral: 'oklch(0.5 0.2 40)',
  other: 'var(--muted-foreground)',
}

function getContactName(c?: Contact): string {
  if (!c) return '—'
  const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
  return name || c.company || c.email || '—'
}

function getInitials(c?: Contact): string {
  const name = getContactName(c)
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  return name.charAt(0).toUpperCase()
}

export function ProjectContactsWidget({
  projectId,
  initialContacts,
  allContacts,
}: {
  projectId: string
  initialContacts: Array<Record<string, unknown>>
  allContacts: Array<Record<string, unknown>>
}) {
  const [contacts, setContacts] = useState<ProjectContact[]>(
    initialContacts as unknown as ProjectContact[]
  )
  const [adding, setAdding] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState('')
  const [selectedRole, setSelectedRole] = useState('client')
  const [loading, setLoading] = useState(false)

  const linkedIds = new Set(contacts.map((c) => c.contact_id))
  const availableContacts = (allContacts as unknown as Contact[]).filter(
    (c) => !linkedIds.has(c.id)
  )

  async function handleAdd() {
    if (!selectedContactId) return
    setLoading(true)
    try {
      const isPrimary = contacts.length === 0
      await crmPost(`projects/${projectId}/contacts`, {
        contact_id: selectedContactId,
        role: selectedRole,
        is_primary: isPrimary,
      })
      // Refresh
      const contact = (allContacts as unknown as Contact[]).find((c) => c.id === selectedContactId)
      const newItem: ProjectContact = {
        id: Date.now().toString(),
        contact_id: selectedContactId,
        role: selectedRole,
        is_primary: isPrimary,
        contact,
      }
      setContacts((prev) => [...prev, newItem])
      setSelectedContactId('')
      setAdding(false)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(contactId: string) {
    setLoading(true)
    try {
      await crmDelete(`projects/${projectId}/contacts/${contactId}`)
      setContacts((prev) => prev.filter((c) => c.contact_id !== contactId))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="crm-card p-5 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          Clients & Contacts
        </h2>
        {!adding && availableContacts.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-4 p-3 rounded-xl space-y-2" style={{ background: 'var(--muted)' }}>
          <select
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="w-full text-sm rounded-lg border border-border px-3 py-2 bg-card"
          >
            <option value="">Sélectionner un contact…</option>
            {availableContacts.map((c) => (
              <option key={c.id} value={c.id}>{getContactName(c)}</option>
            ))}
          </select>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full text-sm rounded-lg border border-border px-3 py-2 bg-card"
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!selectedContactId || loading}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--gradient-primary)' }}
            >
              {loading ? 'Ajout…' : 'Confirmer'}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Contact list */}
      {contacts.length === 0 ? (
        <div className="text-center py-6">
          <Users className="h-8 w-8 text-muted-foreground opacity-30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Aucun contact lié</p>
          {availableContacts.length > 0 && (
            <button
              onClick={() => setAdding(true)}
              className="mt-2 text-xs text-primary hover:underline"
            >
              + Associer un contact
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((pc) => {
            const roleColor = ROLE_COLORS[pc.role] ?? 'var(--muted-foreground)'
            return (
              <div
                key={pc.id}
                className="flex items-center gap-3 p-2.5 rounded-xl group"
                style={{ background: 'var(--muted)' }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 text-xs font-bold text-white"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {getInitials(pc.contact)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/contacts/${pc.contact_id}`}
                      className="text-xs font-semibold hover:text-primary transition-colors truncate"
                    >
                      {getContactName(pc.contact)}
                    </Link>
                    {pc.is_primary && (
                      <Star className="h-3 w-3 shrink-0" style={{ color: 'oklch(0.7 0.15 60)', fill: 'oklch(0.7 0.15 60)' }} />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: roleColor }}>
                    {ROLE_LABELS[pc.role] ?? pc.role}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(pc.contact_id)}
                  disabled={loading}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
