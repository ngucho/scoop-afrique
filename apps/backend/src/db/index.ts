/**
 * Drizzle ORM — PostgreSQL via pooler (DATABASE_URL).
 * Parameterized queries prevent SQL injection.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../config/env.js'
import * as schema from './schema.js'

let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!config.database) {
    throw new Error('DATABASE_URL is required. Set it in .env (pooler from Supabase Connect dialog).')
  }
  if (!_db) {
    const client = postgres(config.database.url, {
      max: 10,
      prepare: false, // Required for Supabase pooler
    })
    _db = drizzle(client, { schema })
  }
  return _db
}
