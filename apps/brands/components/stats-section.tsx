'use client'

import { useEffect, useState } from 'react'

const fallbackStats = [
  { value: '+1,4 M', label: 'Abonnés cumulés' },
  { value: '910 K', label: 'TikTok' },
  { value: '410 K', label: 'Facebook (monétisé)' },
  { value: '12+', label: 'Pays' },
]

function formatMetricLabel(platform: string, metricKey: string): string {
  const p = platform.toLowerCase()
  const m = metricKey.toLowerCase()
  if (m === 'followers' || m === 'subscribers') return `${p} — abonnés`
  if (m === 'views' || m === 'views_30d') return `${p} — vues`
  if (m === 'countries_reach') return 'Pays (portée)'
  return `${platform} — ${metricKey}`
}

function formatMetricValue(raw: string): string {
  const n = Number(raw.replace(',', '.'))
  if (Number.isNaN(n)) return raw
  if (n >= 1_000_000) return `+${(n / 1_000_000).toFixed(1).replace('.', ',')} M`
  if (n >= 1_000) return `${Math.round(n / 1_000)} K`
  return n.toLocaleString('fr-FR')
}

export function StatsSection() {
  const [stats, setStats] = useState(fallbackStats)
  const [source, setSource] = useState<'live' | 'fallback'>('fallback')

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
    if (!api) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`${api}/api/v1/public/audience/summary`, { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as {
          data?: { platform: string; metric_key: string; value_numeric: string }[]
        }
        const rows = json.data ?? []
        if (rows.length === 0 || cancelled) return
        const mapped = rows.slice(0, 8).map((r) => ({
          value: formatMetricValue(r.value_numeric),
          label: formatMetricLabel(r.platform, r.metric_key),
        }))
        if (!cancelled) {
          setStats(mapped.length >= 4 ? mapped.slice(0, 4) : mapped)
          setSource('live')
        }
      } catch {
        /* keep fallback */
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <section className="relative overflow-hidden border-y border-border bg-card py-16 md:py-20">
      {/* Accent ligne gauche */}
      <div className="absolute left-0 top-0 h-full w-1 bg-primary" aria-hidden />

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        {/* Source label */}
        <p className="mb-10 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Audience —{' '}
          {source === 'live'
            ? 'chiffres synchronisés depuis le back-office Scoop'
            : 'mars 2026 · analytics internes'}
        </p>

        {/* Stats en grande typographie éditoriale */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="relative"
            >
              {i > 0 ? (
                <span
                  className="absolute -left-4 top-0 hidden h-full w-px bg-border md:block"
                  aria-hidden
                />
              ) : null}
              <p
                className="font-sans text-[clamp(2rem,4vw,3rem)] font-black leading-none text-primary"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {s.value}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
