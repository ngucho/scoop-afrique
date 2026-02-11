/**
 * Supabase client — service role only (bypasses RLS).
 * Auth is handled by Auth0; no Supabase Auth client needed.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from '../config/env.js'

let serviceClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!config.supabase) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }
  if (!serviceClient) {
    serviceClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false },
    })
  }
  return serviceClient
}
