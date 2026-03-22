'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input, Label } from 'scoop'
import { Search } from 'lucide-react'

const CONTACT_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'client', label: 'Client' },
  { value: 'partner', label: 'Partenaire' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'influencer', label: 'Influenceur' },
  { value: 'other', label: 'Autre' },
]

export function ContactsListToolbar({
  initialSearch = '',
  initialType = '',
  initialCountry = '',
  initialCity = '',
}: {
  initialSearch?: string
  initialType?: string
  initialCountry?: string
  initialCity?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams
  const [search, setSearch] = useState(initialSearch)
  const [type, setType] = useState(initialType)
  const [country, setCountry] = useState(initialCountry)
  const [city, setCity] = useState(initialCity)
  const skipSearchDebounce = useRef(true)

  const replaceKeepingSort = useCallback(
    (updates: Record<string, string | undefined>) => {
      const p = new URLSearchParams(searchParamsRef.current.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v != null && v !== '') p.set(k, v)
        else p.delete(k)
      }
      router.replace(`/contacts?${p.toString()}`)
    },
    [router]
  )

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])
  useEffect(() => {
    setType(initialType)
  }, [initialType])
  useEffect(() => {
    setCountry(initialCountry)
  }, [initialCountry])
  useEffect(() => {
    setCity(initialCity)
  }, [initialCity])

  useEffect(() => {
    if (skipSearchDebounce.current) {
      skipSearchDebounce.current = false
      return
    }
    const t = setTimeout(() => {
      const p = new URLSearchParams(searchParamsRef.current.toString())
      if (search) p.set('search', search)
      else p.delete('search')
      router.replace(`/contacts?${p.toString()}`)
    }, 400)
    return () => clearTimeout(t)
  }, [search, router])

  return (
    <div className="crm-card p-4 mb-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Recherche</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, email, entreprise, téléphone…"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Type</Label>
          <select
            value={type}
            onChange={(e) => {
              const v = e.target.value
              setType(v)
              replaceKeepingSort({
                search: search || undefined,
                type: v || undefined,
                country: country || undefined,
                city: city || undefined,
              })
            }}
            className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {CONTACT_TYPES.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Pays (code)</Label>
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onBlur={() =>
              replaceKeepingSort({
                search: search || undefined,
                type: type || undefined,
                country: country || undefined,
                city: city || undefined,
              })
            }
            placeholder="ex. CI"
            className="mt-1"
            maxLength={4}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Ville</Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onBlur={() =>
              replaceKeepingSort({
                search: search || undefined,
                type: type || undefined,
                country: country || undefined,
                city: city || undefined,
              })
            }
            placeholder="Filtre ville"
            className="mt-1"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Cliquez sur les en-têtes du tableau pour trier. La recherche se met à jour après une courte pause.
      </p>
    </div>
  )
}
