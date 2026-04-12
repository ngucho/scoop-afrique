/**
 * Append-only audience / platform KPI snapshots for dashboards, reports, brands site.
 */
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { audienceMetricSnapshots } from '../db/schema.js'
import { config } from '../config/env.js'

function rowsFromExecute<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[]
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    return (result as { rows: T[] }).rows
  }
  return []
}

export interface AudienceMetricRow {
  id: string
  platform: string
  metric_key: string
  snapshot_date: string
  country_code: string | null
  value_numeric: string
  source: string
  metadata: Record<string, unknown>
  created_at: string
}

function toRow(r: typeof audienceMetricSnapshots.$inferSelect): AudienceMetricRow {
  return {
    id: r.id,
    platform: r.platform,
    metric_key: r.metricKey,
    snapshot_date: r.snapshotDate,
    country_code: r.countryCode,
    value_numeric: String(r.valueNumeric),
    source: r.source,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    created_at: r.createdAt.toISOString(),
  }
}

export async function insertAudienceMetricSnapshot(input: {
  platform: string
  metric_key: string
  snapshot_date: string
  /** ISO country or '' for global aggregate */
  country_code?: string | null
  value_numeric: string | number
  source?: string
  metadata?: Record<string, unknown>
}): Promise<AudienceMetricRow> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  const val =
    typeof input.value_numeric === 'number' ? String(input.value_numeric) : input.value_numeric
  const countryKey = (input.country_code ?? '').trim().toUpperCase() || ''
  const [row] = await db
    .insert(audienceMetricSnapshots)
    .values({
      platform: input.platform.trim(),
      metricKey: input.metric_key.trim(),
      snapshotDate: input.snapshot_date,
      countryCode: countryKey,
      valueNumeric: val,
      source: input.source?.trim() || 'manual',
      metadata: input.metadata ?? {},
    })
    .onConflictDoUpdate({
      target: [
        audienceMetricSnapshots.platform,
        audienceMetricSnapshots.metricKey,
        audienceMetricSnapshots.snapshotDate,
        audienceMetricSnapshots.countryCode,
      ],
      set: {
        valueNumeric: val,
        source: input.source?.trim() || 'manual',
        metadata: input.metadata ?? {},
        createdAt: new Date(),
      },
    })
    .returning()
  if (!row) throw new Error('insert failed')
  return toRow(row)
}

export async function listAudienceMetricsRecent(params: {
  platform?: string
  days?: number
  limit?: number
}): Promise<AudienceMetricRow[]> {
  if (!config.database) return []
  const db = getDb()
  const days = Math.min(params.days ?? 90, 730)
  const limit = Math.min(params.limit ?? 500, 2000)
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().slice(0, 10)

  const conds = [gte(audienceMetricSnapshots.snapshotDate, sinceStr)]
  if (params.platform?.trim()) {
    conds.push(eq(audienceMetricSnapshots.platform, params.platform.trim()))
  }

  const rows = await db
    .select()
    .from(audienceMetricSnapshots)
    .where(and(...conds))
    .orderBy(desc(audienceMetricSnapshots.snapshotDate), desc(audienceMetricSnapshots.createdAt))
    .limit(limit)

  return rows.map(toRow)
}

/** Latest value per (platform, metric_key) for public / brands summary. */
export async function getLatestAudienceMetricsByKey(): Promise<
  { platform: string; metric_key: string; snapshot_date: string; value_numeric: string; country_code: string | null }[]
> {
  if (!config.database) return []
  const db = getDb()
  const raw = await db.execute(sql`
    SELECT DISTINCT ON (platform, metric_key)
      platform,
      metric_key,
      snapshot_date::text AS snapshot_date,
      value_numeric::text AS value_numeric,
      NULLIF(country_code, '') AS country_code
    FROM audience_metric_snapshots
    ORDER BY platform, metric_key, snapshot_date DESC, created_at DESC
  `)
  const rows = rowsFromExecute<{
    platform: string
    metric_key: string
    snapshot_date: string
    value_numeric: string
    country_code: string | null
  }>(raw)
  return rows.map((r) => ({
    platform: r.platform,
    metric_key: r.metric_key,
    snapshot_date: r.snapshot_date,
    value_numeric: r.value_numeric,
    country_code: r.country_code,
  }))
}

export async function getCountryLeaderboard(params: {
  metric_key: string
  platform?: string
  snapshot_date?: string
}): Promise<{ country_code: string; value_numeric: string }[]> {
  if (!config.database) return []
  const db = getDb()
  const dateStr =
    params.snapshot_date ?? new Date().toISOString().slice(0, 10)

  const conds = [
    eq(audienceMetricSnapshots.metricKey, params.metric_key),
    eq(audienceMetricSnapshots.snapshotDate, dateStr),
    sql`${audienceMetricSnapshots.countryCode} <> ''`,
  ]
  if (params.platform?.trim()) {
    conds.push(eq(audienceMetricSnapshots.platform, params.platform.trim()))
  }

  const rows = await db
    .select({
      countryCode: audienceMetricSnapshots.countryCode,
      valueNumeric: audienceMetricSnapshots.valueNumeric,
    })
    .from(audienceMetricSnapshots)
    .where(and(...conds))
    .orderBy(desc(audienceMetricSnapshots.valueNumeric))

  return rows.map((r) => ({
    country_code: r.countryCode as string,
    value_numeric: String(r.valueNumeric),
  }))
}
