/**
 * Batch-ingest audience KPI snapshots from JSON (stdin, file, or AUDIENCE_METRICS_INGEST_JSON env).
 * Intended for cron / CI: `pnpm --filter @scoop-afrique/backend exec tsx scripts/ingest-audience-metrics.ts < metrics.json`
 *
 * Each row: { platform, metric_key, snapshot_date, value_numeric, country_code?, source?, metadata? }
 */
import 'dotenv/config'
import { z } from 'zod'
import * as audienceMetrics from '../src/services/audience-metric.service.js'

const rowSchema = z.object({
  platform: z.string().min(1).max(64),
  metric_key: z.string().min(1).max(128),
  snapshot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  country_code: z.string().max(8).optional().nullable(),
  value_numeric: z.union([z.string(), z.number()]),
  source: z.string().max(32).optional(),
  metadata: z.record(z.unknown()).optional(),
})

async function main() {
  let raw: string
  if (process.env.AUDIENCE_METRICS_INGEST_JSON?.trim()) {
    raw = process.env.AUDIENCE_METRICS_INGEST_JSON
  } else if (process.argv[2]) {
    const { readFile } = await import('node:fs/promises')
    raw = await readFile(process.argv[2], 'utf8')
  } else {
    const chunks: Buffer[] = []
    for await (const c of process.stdin) chunks.push(c as Buffer)
    raw = Buffer.concat(chunks).toString('utf8')
  }

  const parsed = JSON.parse(raw) as unknown
  const rows = Array.isArray(parsed) ? parsed : [parsed]
  let ok = 0
  for (const r of rows) {
    const row = rowSchema.parse(r)
    await audienceMetrics.insertAudienceMetricSnapshot({
      platform: row.platform,
      metric_key: row.metric_key,
      snapshot_date: row.snapshot_date,
      country_code: row.country_code,
      value_numeric: row.value_numeric,
      source: row.source ?? 'cron',
      metadata: row.metadata ?? {},
    })
    ok += 1
  }
  console.log(`ingest-audience-metrics: ${ok} row(s) upserted.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
