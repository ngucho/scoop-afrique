/**
 * Authentication middleware helpers.
 * Extracts the Bearer token, verifies its Auth0 signature and claims, then
 * resolves a business Profile.
 */
import type { Context } from 'hono'
import {
  verifyAuth0Token,
  type StaffAuthResult,
} from './auth0.js'
import type { Auth0JwtFailureReason } from './auth0-jwt.js'
import { getOrCreateProfile } from '../services/profile.service.js'
import type { AppRole } from '../services/profile.service.js'

export interface AuthUser {
  id: string
  auth0_id: string
  email: string
  role: AppRole
  permissions: string[]
}

export type AuthUserResult =
  | { ok: true; user: AuthUser }
  | {
      ok: false
      reason:
        | Auth0JwtFailureReason
        | 'TOKEN_MISSING_STAFF_PERMISSION'
    }

export function getBearerToken(c: Context): string | null {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7).trim() || null
}

/**
 * Get the authenticated user from the request.
 * 1. Extract Bearer token
 * 2. Verify JWT signature and claims against the configured Auth0 tenant
 * 3. Get-or-create profile in DB (id, auth0_id, email, role only)
 */
export function createGetAuthUser(dependencies: {
  verifyToken: typeof verifyAuth0Token
  getProfile: typeof getOrCreateProfile
} = {
  verifyToken: verifyAuth0Token,
  getProfile: getOrCreateProfile,
}) {
  return async function getAuthUser(
    c: Context,
  ): Promise<AuthUserResult> {
    const token = getBearerToken(c)
    if (!token) return { ok: false, reason: 'INVALID_TOKEN' }

    const auth0Result: StaffAuthResult = await dependencies.verifyToken(token)
    if (!auth0Result.ok) return auth0Result

    const profile = await dependencies.getProfile(auth0Result.user)
    return {
      ok: true,
      user: {
        id: profile.id,
        auth0_id: profile.auth0_id,
        email: profile.email ?? auth0Result.user.email,
        role: auth0Result.user.role,
        permissions: auth0Result.user.permissions,
      },
    }
  }
}

export const getAuthUser = createGetAuthUser()

export async function getOptionalAuthUser(
  c: Context,
): Promise<AuthUser | null> {
  const result = await getAuthUser(c)
  return result.ok ? result.user : null
}
