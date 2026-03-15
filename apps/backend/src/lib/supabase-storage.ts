/**
 * Supabase Storage only — for image/PDF uploads.
 * Uses SUPABASE_SERVICE_ROLE_KEY; URL derived from DATABASE_URL.
 * Database access uses Drizzle (getDb), not this client.
 */
import { createClient } from '@supabase/supabase-js'
import { config } from '../config/env.js'

let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseStorage() {
  if (!config.supabase) {
    throw new Error('Storage requires SUPABASE_SERVICE_ROLE_KEY (and DATABASE_URL to derive project URL).')
  }
  if (!_client) {
    _client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false },
    })
  }
  return _client
}
