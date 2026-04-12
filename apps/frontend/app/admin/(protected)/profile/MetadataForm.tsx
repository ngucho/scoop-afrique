'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, Input, Button, Textarea } from 'scoop'
import { IconEdit, IconLoader2 } from '@tabler/icons-react'
import { updateUserMetadata } from '@/lib/admin/actions'
import type { UserMetadata } from '@/lib/admin/session'
import { JournalistAvatarField } from './JournalistAvatarField'

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
  const [publicBio, setPublicBio] = useState(initialMetadata.public_bio ?? '')
  const [publicAvatarUrl, setPublicAvatarUrl] = useState(initialMetadata.public_avatar_url ?? '')
  const [contactPrivate, setContactPrivate] = useState(initialMetadata.contact_private ?? '')
  const [preferences, setPreferences] = useState(initialMetadata.preferences ?? '')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      try {
        await updateUserMetadata({
          name,
          address,
          phone,
          sex,
          public_bio: publicBio,
          public_avatar_url: publicAvatarUrl,
          contact_private: contactPrivate,
          preferences,
        })
        setMessage({
          type: 'success',
          text: 'Informations mises à jour. Auth0 et la base profil sont synchronisés ; reconnectez-vous pour rafraîchir les claims du jeton.',
        })
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
          Stockées dans Auth0 <code className="text-xs">user_metadata</code> (voir Post-Login Action) et partiellement
          en base pour la carte auteur.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Général</h4>
            <div>
              <label className="mb-1 block text-sm font-medium">Nom complet</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Dupont" />
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
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <h4 className="text-sm font-semibold text-primary">Profil public (lecteurs)</h4>
            <p className="text-xs text-muted-foreground">
              Affichés en bas des articles que vous signez. Pas d&apos;email ni de contact direct ici.
            </p>
            <JournalistAvatarField
              value={publicAvatarUrl}
              onChange={setPublicAvatarUrl}
              disabled={isPending}
            />
            <div>
              <label className="mb-1 block text-sm font-medium">Bio</label>
              <Textarea
                value={publicBio}
                onChange={(e) => setPublicBio(e.target.value)}
                rows={4}
                placeholder="Quelques lignes sur votre parcours…"
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <h4 className="text-sm font-semibold text-muted-foreground">Interne / non publié</h4>
            <div>
              <label className="mb-1 block text-sm font-medium">Contact privé (rédaction)</label>
              <Input
                value={contactPrivate}
                onChange={(e) => setContactPrivate(e.target.value)}
                placeholder="Email ou téléphone — non visible sur le site lecteur"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Préférences</label>
              <Textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                rows={3}
                placeholder="Thématiques, disponibilités, notes…"
              />
            </div>
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
