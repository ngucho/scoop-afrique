/**
 * Compare ad_slots.key in the database with the canonical keys used by the reader app (lib/readerAds.ts).
 * Run: pnpm verify:ad-slots (from apps/backend, DATABASE_URL required)
 */
import 'dotenv/config'
import postgres from 'postgres'

/** Keep in sync with apps/frontend/lib/readerAds.ts AD_SLOT_KEYS */
const EXPECTED_KEYS = [
  'GLOBAL_TOP_BANNER',
  'HOME_HERO_SPONSOR',
  'HOME_MID_1',
  'HOME_BOTTOM',
  'HOME_SPONSOR_LOGOS',
  'LIST_TOP',
  'LIST_MID',
  'CAT_TOP',
  'ARTICLE_TOP',
  'ARTICLE_MID',
  'ARTICLE_RAIL',
  'ARTICLE_BOTTOM',
  'RELATED_BELOW',
] as const

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const sql = postgres(url, { max: 1, prepare: false })
  try {
    const rows = await sql<{ key: string }[]>`SELECT key FROM ad_slots ORDER BY key`
    const dbKeys = new Set(rows.map((r) => r.key))
    const expected = new Set<string>(EXPECTED_KEYS)

    const missingInDb = [...expected].filter((k) => !dbKeys.has(k))
    const extraInDb = [...dbKeys].filter((k) => !expected.has(k))

    if (missingInDb.length === 0 && extraInDb.length === 0) {
      console.log('OK: all AD_SLOT_KEYS are present in ad_slots; no unexpected keys.')
      process.exit(0)
    }

    if (missingInDb.length > 0) {
      console.error('Missing in DB (required by frontend):', missingInDb.join(', '))
    }
    if (extraInDb.length > 0) {
      console.warn('Extra in DB (not in AD_SLOT_KEYS):', extraInDb.join(', '))
    }
    process.exit(missingInDb.length > 0 ? 2 : 0)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
