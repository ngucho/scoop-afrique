/**
 * Auth0 JWT validation — local only, no Auth0 network calls.
 *
 * The backend decodes the access token (same technique as the frontend), checks
 * iss, aud, and exp to ensure it comes from our tenant, then reads permissions
 * and maps to a role. Auth0 is only contacted when updating user data (see
 * auth0-management.ts: user_metadata, password).
 */
import { config } from '../config/env.js'
import { logger } from './logger.js'
import type { AppRole, Auth0UserInfo } from '../services/profile.service.js'

/** Map Auth0 permissions array to an AppRole (same as frontend). */
function roleFromPermissions(permissions: string[]): AppRole {
  if (permissions.includes('manage:users')) return 'admin'
  if (permissions.includes('delete:articles')) return 'manager'
  if (permissions.includes('publish:articles')) return 'editor'
  if (
    permissions.includes('create:articles') ||
    permissions.includes('read:articles')
  )
    return 'journalist'
  return 'journalist'
}

/**
 * Decode JWT payload without cryptographic verification (same as frontend).
 * Used only to read claims; we then validate iss, aud, exp locally.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payloadB64 = parts[1]
    if (!payloadB64) return null
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8')
    return JSON.parse(payloadJson) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Verify an Auth0 access token using local validation only (no Auth0 call).
 * Checks: iss matches our tenant, aud matches our API, exp not past, sub present.
 * Returns null if token is invalid or Auth0 config is missing.
 */
export function verifyAuth0Token(accessToken: string): Auth0UserInfo | null {
  if (!config.auth0) return null
  const { domain, audience } = config.auth0
  const expectedIssuer = `https://${domain}/`

  const payload = decodeJwtPayload(accessToken)
  if (!payload) {
    logger.jwtInvalid('Invalid JWT format (decode failed)')
    return null
  }

  const sub = payload.sub
  if (!sub || typeof sub !== 'string') {
    logger.jwtInvalid('Missing or invalid sub claim')
    return null
  }

  const iss = payload.iss
  if (iss !== expectedIssuer) {
    logger.jwtInvalid(`Issuer mismatch: expected ${expectedIssuer}, got ${String(iss)}`)
    return null
  }

  const aud = payload.aud
  const audMatch =
    aud === audience ||
    (Array.isArray(aud) && aud.includes(audience))
  if (!audMatch) {
    logger.jwtInvalid(`Audience mismatch: expected ${audience}, got ${JSON.stringify(aud)}`)
    return null
  }

  const exp = payload.exp
  if (typeof exp !== 'number') {
    logger.jwtInvalid('Missing exp claim')
    return null
  }
  const now = Math.floor(Date.now() / 1000)
  const clockTolerance = 30
  if (exp < now - clockTolerance) {
    logger.jwtInvalid('Token expired')
    return null
  }

  const permissions = (payload.permissions as string[] | undefined) ?? []
  const role = roleFromPermissions(permissions)

  const email =
    (payload.email as string) ??
    (payload[`https://${domain}/email`] as string) ??
    ''

  return {
    sub,
    email,
    role,
  }
}
