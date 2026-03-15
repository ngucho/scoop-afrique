'use client'

import Link from 'next/link'
import { Edit, Package, Tag, DollarSign, CheckCircle, XCircle } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  content: 'oklch(0.42 0.16 260)',
  video: 'oklch(0.5 0.18 20)',
  photo: 'oklch(0.42 0.14 200)',
  strategy: 'oklch(0.42 0.14 145)',
  ads: 'oklch(0.5 0.2 40)',
  event: 'oklch(0.5 0.16 300)',
  design: 'oklch(0.42 0.14 145)',
  other: 'var(--muted-foreground)',
}

export function ServicesClient({
  initialServices,
}: {
  initialServices: Array<Record<string, unknown>>
}) {
  const byCategory = initialServices.reduce<Record<string, Array<Record<string, unknown>>>>((acc, s) => {
    const cat = String(s.category ?? 'other')
    const arr = acc[cat] ?? []
    arr.push(s)
    acc[cat] = arr
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {Object.entries(byCategory).map(([category, services]) => {
        const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-3 rounded-full" style={{ background: color }} />
              <h2 className="text-sm font-semibold capitalize">{category}</h2>
              <span className="text-xs text-muted-foreground">({services.length})</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s, i) => (
                <div
                  key={s.id as string}
                  className={`crm-card crm-card-interactive p-5 group crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1|2|3|4}`}
                  style={!(s.is_active) ? { opacity: 0.6 } : {}}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5"
                        style={{ background: `${color}18` }}
                      >
                        <Package className="h-4 w-4" style={{ color }} strokeWidth={1.8} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm leading-tight">{String(s.name ?? '')}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Tag className="h-2.5 w-2.5" style={{ color }} />
                          <span className="text-[10px] font-semibold capitalize" style={{ color }}>
                            {String(s.slug ?? '')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.is_active ? (
                        <CheckCircle className="h-3.5 w-3.5" style={{ color: 'oklch(0.42 0.14 145)' }} />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <Link
                        href={`/services/${s.id}/edit`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
                      >
                        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>

                  {s.description ? (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                      {String(s.description)}
                    </p>
                  ) : null}

                  <div className="flex items-baseline gap-1.5 pt-3 border-t border-border">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-bold" style={{ color }}>
                      {Number(s.default_price || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                    <span className="text-xs text-muted-foreground">/ {String(s.unit ?? 'unité')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
