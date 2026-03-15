'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from 'scoop'
import { Building2, Plus, X } from 'lucide-react'

type Org = { id: string; name: string; type?: string; role?: string }
type OrgOption = { id: string; name: string }

export function ContactOrganizations({
  contactId,
  initialOrgs,
  allOrganizations,
}: {
  contactId: string
  initialOrgs: Org[]
  allOrganizations: OrgOption[]
}) {
  const [orgs, setOrgs] = useState<Org[]>(initialOrgs)
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  const linkedIds = new Set(orgs.map((o) => o.id))
  const availableOrgs = allOrganizations.filter((o) => !linkedIds.has(o.id))

  async function fetchOrgs() {
    setLoading(true)
    const res = await fetch(`/api/crm/contacts/${contactId}/organizations`, { credentials: 'include' })
    const json = await res.json()
    setLoading(false)
    if (res.ok && json.data) setOrgs(json.data)
  }

  async function handleLink() {
    if (!selectedOrgId) return
    setSubmitting(true)
    const res = await fetch(`/api/crm/contacts/${contactId}/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization_id: selectedOrgId }),
      credentials: 'include',
    })
    setSubmitting(false)
    if (res.ok) {
      setSelectedOrgId('')
      fetchOrgs()
    } else {
      const json = await res.json()
      alert(json.error ?? 'Erreur')
    }
  }

  async function handleUnlink(orgId: string) {
    const res = await fetch(`/api/crm/contacts/${contactId}/organizations/${orgId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) fetchOrgs()
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        Organisations liées
      </h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : orgs.length === 0 && availableOrgs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune organisation.</p>
      ) : (
        <>
          <ul className="space-y-2 mb-4">
            {orgs.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <Link href={`/organizations/${o.id}`} className="text-primary hover:underline">
                  {o.name}
                  {o.role ? ` (${o.role})` : ''}
                </Link>
                <button
                  type="button"
                  onClick={() => handleUnlink(o.id)}
                  className="p-1 text-muted-foreground hover:text-destructive"
                  aria-label="Retirer"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          {availableOrgs.length > 0 && (
            <div className="flex gap-2">
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Sélectionner une organisation</option>
                {availableOrgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLink}
                disabled={!selectedOrgId || submitting}
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
