/**
 * Auth0 identity classification after cryptographic JWT verification.
 *
 * Authorization decisions consume `VerifiedAuth0Jwt`; unverified decoding is
 * restricted to diagnostic summaries that never feed profile or role changes.
 */
import { config } from '../config/env.js'
import {
  hasReaderAccountPermission,
  hasStaffApiAccess,
  READER_ACCOUNT_PERMISSION,
} from './api-permissions.js'
import {
  verifyConfiguredAuth0Jwt,
  type Auth0JwtFailureReason,
  type VerifiedAuth0Jwt,
} from './auth0-jwt.js'
import type { AppRole, Auth0UserInfo } from '../services/profile.service.js'

export interface StaffAuth0UserInfo extends Auth0UserInfo {
  permissions: string[]
}

export type StaffAuthResult =
  | { ok: true; user: StaffAuth0UserInfo }
  | {
      ok: false
      reason: Auth0JwtFailureReason | 'TOKEN_MISSING_STAFF_PERMISSION'
    }

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

export function staffInfoFromVerifiedToken(
  token: VerifiedAuth0Jwt,
): StaffAuth0UserInfo | null {
  if (!hasStaffApiAccess(token.permissions)) return null
  return {
    sub: token.sub,
    email: readEmailFromAuth0AccessTokenPayload(
      token.payload as Record<string, unknown>,
      config.auth0?.domain ?? '',
    ),
    role: roleFromPermissions(token.permissions),
    permissions: token.permissions,
  }
}

export function readerInfoFromVerifiedToken(
  token: VerifiedAuth0Jwt,
): ReaderAuth0TokenInfo | null {
  if (!hasReaderAccountPermission(token.permissions)) return null
  return {
    sub: token.sub,
    email: readEmailFromAuth0AccessTokenPayload(
      token.payload as Record<string, unknown>,
      config.auth0?.domain ?? '',
    ),
  }
}

export async function verifyAuth0Token(
  accessToken: string,
): Promise<StaffAuthResult> {
  const verified = await verifyConfiguredAuth0Jwt(accessToken)
  if (!verified.ok) return verified
  const user = staffInfoFromVerifiedToken(verified.token)
  return user
    ? { ok: true, user }
    : { ok: false, reason: 'TOKEN_MISSING_STAFF_PERMISSION' }
}

export type ReaderRouteAuthResult =
  | { ok: true; user: ReaderAuth0TokenInfo }
  | {
      ok: false
      reason: Auth0JwtFailureReason | 'TOKEN_MISSING_API_PERMISSIONS'
      verifiedSub?: string
    }

/**
 * Single verified path for `/api/v1/reader/*`: valid JWT for this API plus
 * either `access:reader` or a staff API permission.
 */
export async function inspectTokenForReaderRoutes(
  accessToken: string,
): Promise<ReaderRouteAuthResult> {
  const verified = await verifyConfiguredAuth0Jwt(accessToken)
  if (!verified.ok) return verified

  const email = readEmailFromAuth0AccessTokenPayload(
    verified.token.payload as Record<string, unknown>,
    config.auth0?.domain ?? '',
  )
  if (
    hasReaderAccountPermission(verified.token.permissions) ||
    hasStaffApiAccess(verified.token.permissions)
  ) {
    return {
      ok: true,
      user: { sub: verified.token.sub, email },
    }
  }

  return {
    ok: false,
    reason: 'TOKEN_MISSING_API_PERMISSIONS',
    verifiedSub: verified.token.sub,
  }
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
