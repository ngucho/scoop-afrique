export interface AudienceMetricRow {
  platform: string
  metric_key: string
  snapshot_date: string
  value_numeric: string
  country_code: string | null
}

export interface BrandAudienceStat {
  key: string
  label: string
  value: number
  display: string
  source: 'admin' | 'fallback'
}

export interface BrandAudienceSummary {
  stats: BrandAudienceStat[]
  totalSocial: BrandAudienceStat
  siteVisits: BrandAudienceStat
  sourceLabel: string
}

const FALLBACKS: Record<string, { label: string; value: number }> = {
  tiktok: { label: 'TikTok', value: 1_000_000 },
  facebook: { label: 'Facebook', value: 488_000 },
  instagram: { label: 'Instagram', value: 46_600 },
  threads: { label: 'Threads', value: 101_000 },
  site: { label: 'Visites mensuelles site', value: 10_000 },
}

function normalizeKey(platform: string): string {
  const p = platform.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (p.includes('tiktok')) return 'tiktok'
  if (p.includes('facebook') || p === 'fb') return 'facebook'
  if (p.includes('instagram') || p === 'ig') return 'instagram'
  if (p.includes('thread')) return 'threads'
  if (p.includes('site') || p.includes('web') || p.includes('website')) return 'site'
  return p
}

function metricIsAudience(metricKey: string): boolean {
  const key = metricKey.toLowerCase()
  return key === 'followers' || key === 'subscribers' || key === 'audience'
}

function metricIsSiteVisits(metricKey: string): boolean {
  const key = metricKey.toLowerCase()
  return key === 'visits' || key === 'visits_30d' || key === 'sessions' || key === 'pageviews'
}

export function formatAudienceNumber(value: number): string {
  if (value >= 1_000_000) {
    return `+${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1).replace('.', ',').replace(',0', '')}M`
  }
  if (value >= 100_000) return `+${Math.round(value / 1000)}K`
  if (value >= 10_000) return `+${Math.round(value / 1000)}K`
  return value.toLocaleString('fr-FR')
}

function pickRows(rows: AudienceMetricRow[]): Map<string, AudienceMetricRow> {
  const picked = new Map<string, AudienceMetricRow>()
  for (const row of rows) {
    const key = normalizeKey(row.platform)
    if (key === 'site') {
      if (metricIsSiteVisits(row.metric_key)) picked.set('site', row)
      continue
    }
    if (metricIsAudience(row.metric_key)) picked.set(key, row)
  }
  return picked
}

export function buildBrandAudienceSummary(rows: AudienceMetricRow[]): BrandAudienceSummary {
  const picked = pickRows(rows)
  const socialKeys = ['tiktok', 'facebook', 'instagram', 'threads']
  const stats = socialKeys.map((key) => {
    const row = picked.get(key)
    const fallback = FALLBACKS[key]!
    const value = row ? Number(row.value_numeric) : fallback.value
    return {
      key,
      label: fallback.label,
      value,
      display: formatAudienceNumber(value),
      source: row ? 'admin' as const : 'fallback' as const,
    }
  })
  const siteRow = picked.get('site')
  const siteValue = siteRow ? Number(siteRow.value_numeric) : FALLBACKS.site.value
  const totalValue = stats.reduce((sum, stat) => sum + stat.value, 0)
  const hasAdmin = stats.some((stat) => stat.source === 'admin') || !!siteRow

  return {
    stats,
    totalSocial: {
      key: 'total',
      label: 'Audience sociale cumulee',
      value: totalValue,
      display: formatAudienceNumber(totalValue),
      source: hasAdmin ? 'admin' : 'fallback',
    },
    siteVisits: {
      key: 'site',
      label: FALLBACKS.site.label,
      value: siteValue,
      display: formatAudienceNumber(siteValue),
      source: siteRow ? 'admin' : 'fallback',
    },
    sourceLabel: hasAdmin ? 'Synchronise depuis admin / audience metrics' : 'Fallback media kit 2026',
  }
}

export async function getBrandAudienceSummary(): Promise<BrandAudienceSummary> {
  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
  if (!api) return buildBrandAudienceSummary([])
  try {
    const res = await fetch(`${api}/api/v1/public/audience/summary`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return buildBrandAudienceSummary([])
    const json = (await res.json()) as { data?: AudienceMetricRow[] }
    return buildBrandAudienceSummary(json.data ?? [])
  } catch {
    return buildBrandAudienceSummary([])
  }
}
