'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from 'scoop'
import { Users, Plus, X } from 'lucide-react'

type Contact = { id: string; first_name?: string; last_name?: string; email?: string; role?: string }
type ContactOption = { id: string; first_name?: string; last_name?: string }

export function OrganizationContacts({
  organizationId,
  initialContacts,
  allContacts,
}: {
  organizationId: string
  initialContacts: Contact[]
  allContacts: ContactOption[]
}) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [selectedContactId, setSelectedContactId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const linkedIds = new Set(contacts.map((c) => c.id))
  const availableContacts = allContacts.filter((c) => !linkedIds.has(c.id))

  async function fetchContacts() {
    const res = await fetch(`/api/crm/organizations/${organizationId}/contacts`, { credentials: 'include' })
    const json = await res.json()
    if (res.ok && json.data) setContacts(json.data)
  }

  async function handleLink() {
    if (!selectedContactId) return
    setSubmitting(true)
    const res = await fetch(`/api/crm/organizations/${organizationId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: selectedContactId }),
      credentials: 'include',
    })
    setSubmitting(false)
    if (res.ok) {
      setSelectedContactId('')
      fetchContacts()
    } else {
      const json = await res.json()
      alert(json.error ?? 'Erreur')
    }
  }

  async function handleUnlink(contactId: string) {
    const res = await fetch(`/api/crm/organizations/${organizationId}/contacts/${contactId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) fetchContacts()
  }

  function contactName(c: Contact) {
    const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
    return name || (c.email ?? '—')
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Contacts liés
      </h2>
      {contacts.length === 0 && availableContacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun contact.</p>
      ) : (
        <>
          <ul className="space-y-2 mb-4">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <Link href={`/contacts/${c.id}`} className="text-primary hover:underline">
                  {contactName(c)}
                  {c.role ? ` (${c.role})` : ''}
                </Link>
                <button
                  type="button"
                  onClick={() => handleUnlink(c.id)}
                  className="p-1 text-muted-foreground hover:text-destructive"
                  aria-label="Retirer"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          {availableContacts.length > 0 && (
            <div className="flex gap-2">
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un contact</option>
                {availableContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.id}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLink}
                disabled={!selectedContactId || submitting}
              >
                <Plus className="h-4 w-4 mr-1" />
                Lier
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
