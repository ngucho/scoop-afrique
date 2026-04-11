'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, Label } from 'scoop'
import { LayoutGrid, List as ListIcon, Search } from 'lucide-react'
import type { CrmListViewMode } from '@/lib/crm-list-query'

export function CrmSearchViewToolbar({
  basePath,
  initialSearch = '',
  defaultView = 'list',
  showViewToggle = true,
}: {
  basePath: string
  initialSearch?: string
  /** Vue utilisée lorsque le paramètre `view` est absent dans l’URL */
  defaultView?: CrmListViewMode
  showViewToggle?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  const [search, setSearch] = useState(initialSearch)
  const skipDebounce = useRef(true)

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  const view: CrmListViewMode =
    searchParams.get('view') === 'cards'
      ? 'cards'
      : searchParams.get('view') === 'list'
        ? 'list'
        : defaultView

  const replaceAll = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParamsRef.current.toString())
      mutate(p)
      const qs = p.toString()
      router.replace(qs ? `${basePath}?${qs}` : basePath)
    },
    [router, basePath]
  )

  useEffect(() => {
    if (skipDebounce.current) {
      skipDebounce.current = false
      return
    }
    const t = setTimeout(() => {
      replaceAll((p) => {
        if (search.trim()) p.set('search', search.trim())
        else {
          p.delete('search')
          p.delete('q')
        }
      })
    }, 400)
    return () => clearTimeout(t)
  }, [search, replaceAll])

  function setView(next: CrmListViewMode) {
    replaceAll((p) => {
      p.set('view', next)
    })
  }

  function reset() {
    setSearch('')
    replaceAll((p) => {
      p.delete('search')
      p.delete('q')
      p.delete('view')
    })
  }

  return (
    <div className="crm-card p-4 mb-4 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <Label className="text-xs text-muted-foreground">Recherche</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            placeholder="Référence, titre, client…"
          />
        </div>
      </div>
      {showViewToggle ? (
        <div className="flex rounded-lg border border-border p-0.5">
          <Button
            type="button"
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-1"
            onClick={() => setView('list')}
          >
            <ListIcon className="h-4 w-4" />
            Liste
          </Button>
          <Button
            type="button"
            variant={view === 'cards' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-1"
            onClick={() => setView('cards')}
          >
            <LayoutGrid className="h-4 w-4" />
            Cartes
          </Button>
        </div>
      ) : null}
      <Button type="button" variant="outline" size="sm" onClick={reset}>
        Réinitialiser
      </Button>
    </div>
  )
}
