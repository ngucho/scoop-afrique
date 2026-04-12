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
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="border-b border-[var(--surface-border)] bg-[var(--surface)] py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <p className="mb-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Audience —{' '}
          {source === 'live'
            ? 'chiffres synchronisés depuis le back-office Scoop'
            : 'mars 2026 · analytics internes (fallback si API indisponible)'}
        </p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <span className="block font-sans text-xl font-bold text-primary sm:text-2xl">{s.value}</span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
