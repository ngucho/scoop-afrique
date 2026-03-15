/**
 * Bootstrap Drizzle migrations for an EXISTING database.
 *
 * Use this when your DB was set up with Supabase migrations and you're
 * switching to Drizzle. It creates the __drizzle_migrations__ table and
 * inserts a record so Drizzle considers all 14 migrations already applied.
 *
 * Run once: pnpm db:bootstrap
 * Then: pnpm db:migrate (will do nothing; future migrations work normally)
 */
import 'dotenv/config'
import postgres from 'postgres'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MIGRATIONS_TABLE = '__drizzle_migrations__'

// Last migration's "when" from journal - insert record with this so all are considered applied
const LAST_MIGRATION_WHEN = 1742342400000

async function bootstrap() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is required. Set it in apps/backend/.env')
  }

  const sql = postgres(url, { max: 1, prepare: false })

  try {
    // Create table if not exists (matches Drizzle's structure)
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public."${MIGRATIONS_TABLE}" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `)

    // Check if we already have records (migrations were run)
    const existing = await sql.unsafe(`
      SELECT id FROM public."${MIGRATIONS_TABLE}"
      ORDER BY created_at DESC LIMIT 1
    `)

    if (existing.length > 0) {
      console.log('Drizzle migrations table already has records. Nothing to do.')
      return
    }

    // Insert records for each migration (hash + created_at)
    // Drizzle compares last record's created_at with each migration's folderMillis
    const journalPath = join(__dirname, '../drizzle/meta/_journal.json')
    const journal = JSON.parse(readFileSync(journalPath, 'utf-8'))
    const entries = journal.entries as { tag: string; when: number }[]

    for (const entry of entries) {
      const migrationPath = join(__dirname, `../drizzle/${entry.tag}.sql`)
      if (!existsSync(migrationPath)) {
        throw new Error(`Migration file not found: ${entry.tag}.sql`)
      }
      const content = readFileSync(migrationPath, 'utf-8')
      const hash = crypto.createHash('sha256').update(content).digest('hex')

      await sql.unsafe(
        `INSERT INTO public."${MIGRATIONS_TABLE}" (hash, created_at) VALUES ('${hash}', ${entry.when})`
      )
    }

    console.log(`Bootstrap complete: ${entries.length} migrations marked as applied.`)
    console.log('Run pnpm db:migrate to verify (it should report nothing to do).')
  } finally {
    await sql.end()
  }
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err)
  process.exit(1)
})
