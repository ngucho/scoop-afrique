/**
 * Authentication middleware helpers.
 * Extracts Bearer token, verifies locally (decode + iss/aud/exp, no Auth0 call), resolves to a Profile.
 * Profile is business-only (id, auth0_id, email, role). Auth0 is only called when updating user data (see auth0-management).
 */
import type { Context } from 'hono'
import { verifyAuth0Token } from './auth0.js'
import { getOrCreateProfile } from '../services/profile.service.js'
import type { Profile, AppRole } from '../services/profile.service.js'

export interface AuthUser {
  id: string
  auth0_id: string
  email: string
  role: AppRole
}

export function getBearerToken(c: Context): string | null {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7).trim() || null
}

/**
 * Get the authenticated user from the request.
 * 1. Extract Bearer token
 * 2. Verify locally (decode JWT, check iss/aud/exp — no Auth0 network call)
 * 3. Get-or-create profile in DB (id, auth0_id, email, role only)
 */
export async function getAuthUser(c: Context): Promise<AuthUser | null> {
  const token = getBearerToken(c)
  if (!token) return null

  const auth0Info = verifyAuth0Token(token)
  if (!auth0Info) return null

  const profile = await getOrCreateProfile(auth0Info)

  return {
    id: profile.id,
    auth0_id: profile.auth0_id,
    email: profile.email ?? auth0Info.email,
    role: auth0Info.role,
  }
}
