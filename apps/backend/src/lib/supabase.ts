/**
 * Supabase client — for Storage only (images, PDFs).
 * Database access uses Drizzle (getDb) with DATABASE_URL.
 * Auth is handled by Auth0; no Supabase Auth client needed.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from '../config/env.js'

let serviceClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!config.supabase) {
    throw new Error('Storage requires SUPABASE_SERVICE_ROLE_KEY (URL derived from DATABASE_URL).')
  }
  if (!serviceClient) {
    serviceClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false },
    })
  }
  return serviceClient
}
