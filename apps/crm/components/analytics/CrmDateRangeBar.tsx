'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label } from 'scoop'

type Props = {
  /** Dates affichées (YYYY-MM-DD), alignées sur l’URL / le serveur */
  from: string
  to: string
  /** Chemin sans query, ex. /dashboard ou /reports */
  basePath: string
  className?: string
}

export function CrmDateRangeBar({ from, to, basePath, className = '' }: Props) {
  const [localFrom, setLocalFrom] = useState(from)
  const [localTo, setLocalTo] = useState(to)

  useEffect(() => {
    setLocalFrom(from)
    setLocalTo(to)
  }, [from, to])

  function apply() {
    if (!localFrom || !localTo) return
    const a = localFrom <= localTo ? localFrom : localTo
    const b = localFrom <= localTo ? localTo : localFrom
    const q = new URLSearchParams()
    q.set('from', a)
    q.set('to', b)
    // Navigation complète : router.replace + refresh ne mettent pas toujours à jour les RSC (App Router)
    const path = `${basePath.startsWith('/') ? basePath : `/${basePath}`}?${q.toString()}`
    window.location.assign(path)
  }

  return (
    <div
      className={`crm-card p-4 flex flex-wrap items-end gap-3 ${className}`.trim()}
    >
      <div>
        <Label className="text-xs text-muted-foreground">Du</Label>
        <Input
          type="date"
          value={localFrom}
          onChange={(e) => setLocalFrom(e.target.value)}
          className="mt-1 w-[160px]"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Au</Label>
        <Input
          type="date"
          value={localTo}
          onChange={(e) => setLocalTo(e.target.value)}
          className="mt-1 w-[160px]"
        />
      </div>
      <Button type="button" onClick={apply} className="rounded-full">
        Appliquer
      </Button>
      <p className="text-xs text-muted-foreground w-full sm:w-auto sm:ml-1">
        Période d’analyse : graphiques et totaux sont recalculés côté serveur.
      </p>
    </div>
  )
}
