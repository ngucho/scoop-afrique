/**
 * Profile service — get-or-create profiles from Auth0 JWT.
 *
 * Auth0 is the sole IAM. Personal data (name, picture, etc.) stays in Auth0.
 * Supabase profiles store only: id, auth0_id, email, role (business identity).
 * Business data (articles, comments, media) link to profiles via id; email is the stable user identifier.
 */
import { getSupabase } from '../lib/supabase.js'
import { config } from '../config/env.js'
import { profileCache } from '../lib/cache.js'

export type AppRole = 'journalist' | 'editor' | 'manager' | 'admin'

export interface Profile {
  id: string
  auth0_id: string
  email: string | null
  role: AppRole
  created_at: string
  updated_at: string
}

export interface Auth0UserInfo {
  sub: string
  email: string
  role: AppRole
}

/**
 * Get or create a profile from Auth0 user info.
 * Only stores id, auth0_id, email, role.
 */
export async function getOrCreateProfile(info: Auth0UserInfo): Promise<Profile> {
  if (!config.supabase) {
    return {
      id: info.sub,
      auth0_id: info.sub,
      email: info.email,
      role: info.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  const cacheKey = `profile:${info.sub}`

  const cached = profileCache.get(cacheKey) as Profile | undefined
  if (cached) {
    const needsSync = cached.role !== info.role || cached.email !== info.email
    if (!needsSync) return cached

    const supabase = getSupabase()
    const { data: updated } = await supabase
      .from('profiles')
      .update({ role: info.role, email: info.email })
      .eq('id', cached.id)
      .select()
      .single()

    const result = (updated ?? cached) as Profile
    profileCache.set(cacheKey, result)
    return result
  }

  const supabase = getSupabase()
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth0_id', info.sub)
    .single()

  if (existing) {
    const needsUpdate =
      existing.role !== info.role || (existing.email ?? null) !== info.email

    if (needsUpdate) {
      const { data: updated } = await supabase
        .from('profiles')
        .update({ role: info.role, email: info.email })
        .eq('id', existing.id)
        .select()
        .single()
      const result = (updated ?? existing) as Profile
      profileCache.set(cacheKey, result)
      return result
    }

    profileCache.set(cacheKey, existing)
    return existing as Profile
  }

  const { data: created, error } = await supabase
    .from('profiles')
    .insert({
      auth0_id: info.sub,
      email: info.email,
      role: info.role,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create profile: ${error.message}`)
  const result = created as Profile
  profileCache.set(cacheKey, result)
  return result
}

/** Get profile by UUID (for joins). Cached. */
export async function getProfileById(id: string): Promise<Profile | null> {
  if (!config.supabase) return null

  const cacheKey = `profile:id:${id}`
  const cached = profileCache.get(cacheKey) as Profile | undefined
  if (cached) return cached

  const supabase = getSupabase()
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (data) profileCache.set(cacheKey, data)
  return (data as Profile) ?? null
}
