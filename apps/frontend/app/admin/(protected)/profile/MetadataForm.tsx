'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, Input, Button } from 'scoop'
import { IconEdit, IconLoader2 } from '@tabler/icons-react'
import { updateUserMetadata } from '@/lib/admin/actions'
import type { UserMetadata } from '@/lib/admin/session'

const SEX_OPTIONS = [
  { value: '', label: 'Non renseigné' },
  { value: 'male', label: 'Homme' },
  { value: 'masculin', label: 'Masculin' },
  { value: 'female', label: 'Femme' },
  { value: 'feminin', label: 'Féminin' },
  { value: 'other', label: 'Autre' },
]

export function MetadataForm({ initialMetadata }: { initialMetadata: UserMetadata }) {
  const [name, setName] = useState(initialMetadata.name ?? '')
  const [address, setAddress] = useState(initialMetadata.address ?? '')
  const [phone, setPhone] = useState(initialMetadata.phone ?? '')
  const [sex, setSex] = useState(initialMetadata.sex ?? '')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      try {
        await updateUserMetadata({ name, address, phone, sex })
        setMessage({ type: 'success', text: 'Informations mises à jour. Elles seront visibles à la prochaine connexion.' })
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Impossible de mettre à jour les informations.',
        })
      }
    })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-2 font-semibold">Informations personnelles</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Ces informations sont stockées dans Auth0. Les modifications seront reflétées à la prochaine connexion.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nom complet</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Adresse</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Rue Example, Abidjan"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Téléphone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 XX XX XX XX"
              type="tel"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sexe</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {SEX_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {message && (
            <p
              className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={isPending} className="inline-flex items-center gap-2">
            {isPending ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconEdit className="h-4 w-4" />
            )}
            <span>Enregistrer</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
