'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input, Label } from 'scoop'
import { Search } from 'lucide-react'

/** Suggestions uniquement — le filtre accepte toute valeur saisie (recherche partielle côté API). */
const ORG_TYPE_SUGGESTIONS = [
  'media',
  'marque',
  'brand',
  'agence',
  'ONG',
  'startup',
  'institution',
  'PME',
  'label',
  'autre',
]

export function OrganizationsListToolbar({
  initialSearch = '',
  initialType = '',
  initialCountry = '',
}: {
  initialSearch?: string
  initialType?: string
  initialCountry?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams
  const [search, setSearch] = useState(initialSearch)
  const [type, setType] = useState(initialType)
  const [country, setCountry] = useState(initialCountry)
  const skipSearchDebounce = useRef(true)

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
    if (skipSearchDebounce.current) {
      skipSearchDebounce.current = false
      return
    }
    const t = setTimeout(() => {
      const p = new URLSearchParams(searchParamsRef.current.toString())
      if (search) p.set('search', search)
      else p.delete('search')
      router.replace(`/organizations?${p.toString()}`)
    }, 400)
    return () => clearTimeout(t)
  }, [search, router])

  const replaceKeepingSort = useCallback((updates: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParamsRef.current.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v != null && v !== '') p.set(k, v)
      else p.delete(k)
    }
    router.replace(`/organizations?${p.toString()}`)
  }, [router])

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
              placeholder="Nom, email, site web, téléphone…"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Type (texte libre)</Label>
          <Input
            id="org-list-type"
            list="org-type-suggestions"
            value={type}
            onChange={(e) => setType(e.target.value)}
            onBlur={() =>
              replaceKeepingSort({
                search: search || undefined,
                type: type.trim() || undefined,
                country: country || undefined,
              })
            }
            placeholder="ex. label, ONG, PME…"
            className="mt-1"
          />
          <datalist id="org-type-suggestions">
            {ORG_TYPE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
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
              })
            }
            placeholder="ex. CI"
            className="mt-1"
            maxLength={4}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Cliquez sur les en-têtes du tableau pour trier par nom ou date de création.
      </p>
    </div>
  )
}
