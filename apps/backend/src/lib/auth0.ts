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
import {
  hasReaderAccountPermission,
  hasStaffApiAccess,
  READER_ACCOUNT_PERMISSION,
} from './api-permissions.js'
import type { AppRole, Auth0UserInfo } from '../services/profile.service.js'

/** Verified reader JWT: includes `access:reader` (may coexist with staff permissions on same user). */
export interface ReaderAuth0TokenInfo {
  sub: string
  email: string
}

/** Map Auth0 permissions array to an AppRole (same as frontend). */
function roleFromPermissions(permissions: string[]): AppRole {
  if (permissions.includes('manage:users')) return 'admin'
  if (permissions.includes('delete:articles') || permissions.includes('manage:crm')) return 'manager'
  if (
    permissions.includes('publish:articles') ||
    permissions.includes('write:crm') ||
    permissions.includes('read:crm')
  )
    return 'editor'
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

/** `sub` from JWT payload (bootstrap / logging only; validate iss/aud/exp separately). */
export function readAccessTokenSub(accessToken: string): string | null {
  const payload = decodeJwtPayload(accessToken)
  const sub = payload?.sub
  return typeof sub === 'string' ? sub : null
}

const SCOOP_CLAIM_NS = 'https://www.scoop-afrique.com'

/**
 * Best-effort email from access token (Google + API audience often omits top-level `email`).
 * Also checks namespaced claims and `user_metadata.email` if copied into the token by an Action.
 */
export function readEmailFromAuth0AccessTokenPayload(
  payload: Record<string, unknown>,
  domain: string,
): string {
  const pick = (v: unknown): string | undefined => {
    if (typeof v !== 'string') return undefined
    const t = v.trim()
    return t.includes('@') ? t : undefined
  }

  const fromUserMetadata = (): string | undefined => {
    const um = payload[`${SCOOP_CLAIM_NS}/user_metadata`]
    if (!um || typeof um !== 'object') return undefined
    const rec = um as Record<string, unknown>
    return pick(rec.email) ?? pick(rec.Email)
  }

  return (
    pick(payload.email) ??
    pick(payload[`https://${domain}/email`]) ??
    pick(payload[`${SCOOP_CLAIM_NS}/email`]) ??
    fromUserMetadata() ??
    ''
  )
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

  if (!hasStaffApiAccess(permissions)) {
    logger.jwtInvalid('Staff API requires at least one employee permission (not reader-only)')
    return null
  }

  const role = roleFromPermissions(permissions)
  const email = readEmailFromAuth0AccessTokenPayload(payload, domain)

  return {
    sub,
    email,
    role,
  }
}

/**
 * Verify access token for reader-facing API routes: must include `access:reader`.
 * Staff permissions on the same token are allowed (rédaction + abonné).
 * Pure staff tokens (no `access:reader`) are rejected — use `verifyAuth0Token` / staff routes.
 */
export function verifyReaderAuth0Token(accessToken: string): ReaderAuth0TokenInfo | null {
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
  if (!hasReaderAccountPermission(permissions)) {
    logger.jwtInvalid('Reader API requires access:reader permission')
    return null
  }

  const email = readEmailFromAuth0AccessTokenPayload(payload, domain)

  return {
    sub,
    email,
  }
}

export type ReaderRouteAuthResult =
  | { ok: true; user: ReaderAuth0TokenInfo }
  | { ok: false; reason: string }

/**
 * Single validation path for `/api/v1/reader/*`: valid JWT for this API + either `access:reader` or a staff API permission.
 * Used for diagnostics when the client gets 401 (Auth0 RBAC, audience, or empty permissions).
 */
export function inspectTokenForReaderRoutes(accessToken: string): ReaderRouteAuthResult {
  if (!config.auth0) return { ok: false, reason: 'AUTH0_NOT_CONFIGURED' }
  const { domain, audience } = config.auth0
  const expectedIssuer = `https://${domain}/`

  const payload = decodeJwtPayload(accessToken)
  if (!payload) return { ok: false, reason: 'JWT_MALFORMED' }

  const sub = payload.sub
  if (!sub || typeof sub !== 'string') return { ok: false, reason: 'MISSING_SUB' }

  const iss = payload.iss
  if (iss !== expectedIssuer) return { ok: false, reason: 'ISSUER_MISMATCH' }

  const aud = payload.aud
  const audMatch = aud === audience || (Array.isArray(aud) && aud.includes(audience))
  if (!audMatch) return { ok: false, reason: 'AUDIENCE_MISMATCH' }

  const exp = payload.exp
  if (typeof exp !== 'number') return { ok: false, reason: 'MISSING_EXP' }
  const now = Math.floor(Date.now() / 1000)
  const clockTolerance = 30
  if (exp < now - clockTolerance) return { ok: false, reason: 'TOKEN_EXPIRED' }

  const permissions = (payload.permissions as string[] | undefined) ?? []
  const email = readEmailFromAuth0AccessTokenPayload(payload, domain)

  if (hasReaderAccountPermission(permissions) || hasStaffApiAccess(permissions)) {
    return { ok: true, user: { sub, email } }
  }

  return { ok: false, reason: 'TOKEN_MISSING_API_PERMISSIONS' }
}

/** Safe JWT payload fields for server logs (no secrets, truncated sub). */
export function summarizeAccessTokenForLogs(accessToken: string): {
  decode_ok: boolean
  summary: Record<string, unknown>
} {
  const payload = decodeJwtPayload(accessToken)
  if (!payload) {
    return { decode_ok: false, summary: { decode: 'JWT_MALFORMED' } }
  }

  const permissions = (payload.permissions as string[] | undefined) ?? []
  const aud = payload.aud
  const expectedAud = config.auth0?.audience
  const audMatch =
    expectedAud != null &&
    (aud === expectedAud || (Array.isArray(aud) && aud.includes(expectedAud)))

  const exp = payload.exp
  const now = Math.floor(Date.now() / 1000)
  const expInS = typeof exp === 'number' ? exp - now : undefined
  const sub = typeof payload.sub === 'string' ? payload.sub : null

  const permsOut =
    permissions.length <= 40 ? permissions : [...permissions.slice(0, 40), '…truncated']

  return {
    decode_ok: true,
    summary: {
      sub_prefix: sub ? `${sub.slice(0, 18)}…` : null,
      iss: payload.iss,
      aud,
      aud_expected: expectedAud ?? null,
      aud_match: expectedAud != null ? audMatch : undefined,
      exp_in_s: expInS,
      expired: typeof exp === 'number' ? exp < now - 30 : undefined,
      azp: payload.azp,
      gty: payload.gty,
      scope: typeof payload.scope === 'string' ? payload.scope : undefined,
      permissions: permsOut,
      permissions_count: permissions.length,
      has_access_reader: permissions.includes(READER_ACCOUNT_PERMISSION),
      has_staff_perm: hasStaffApiAccess(permissions),
    },
  }
}
