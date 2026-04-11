/**
 * Smoke-check ad_campaigns + ad_creatives columns match Drizzle (migrations 0033–0035).
 * Usage: pnpm --filter @scoop-afrique/backend exec tsx scripts/verify-reader-ads-schema.ts
 */
import 'dotenv/config'
import postgres from 'postgres'

const requiredCampaignCols = [
  'id',
  'slot_id',
  'name',
  'status',
  'start_at',
  'end_at',
  'weight',
  'created_by',
  'created_at',
  'updated_at',
] as const
const requiredCreativeCols = [
  'id',
  'campaign_id',
  'headline',
  'body',
  'image_url',
  'link_url',
  'creative_format',
  'cta_label',
  'video_url',
  'alt',
  'weight',
  'is_active',
  'sort_order',
  'created_at',
  'updated_at',
] as const

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }
  const sql = postgres(url, { max: 1 })
  try {
    const cols = await sql<{ table_name: string; column_name: string }[]>`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('ad_campaigns', 'ad_creatives')
    `
    const byTable = (t: string) => new Set(cols.filter((c) => c.table_name === t).map((c) => c.column_name))

    const camp = byTable('ad_campaigns')
    const crea = byTable('ad_creatives')
    let ok = true
    for (const c of requiredCampaignCols) {
      if (!camp.has(c)) {
        console.error(`Missing ad_campaigns.${c}`)
        ok = false
      }
    }
    for (const c of requiredCreativeCols) {
      if (!crea.has(c)) {
        console.error(`Missing ad_creatives.${c}`)
        ok = false
      }
    }
    if (crea.has('slot_id')) {
      console.error(
        'Legacy ad_creatives.slot_id must be dropped (placement is ad_campaigns.slot_id). Run migration 0035.',
      )
      ok = false
    }
    if (!ok) process.exit(1)
    console.log('OK: ad_campaigns and ad_creatives have required columns for reader admin ads.')
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
