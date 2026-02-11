/**
 * Auth0 v4 server-side client and helpers. Use in Server Components or Route Handlers.
 *
 * AUTH0_AUDIENCE must be set to your backend API identifier so the login flow requests
 * an access token for that API. The token will include the `permissions` claim when
 * Auth0 RBAC is enabled and "Add Permissions in the Access Token" is on (see docs/AUTH0_SETUP.md §10).
 */
import { Auth0Client } from '@auth0/nextjs-auth0/server'

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE ?? undefined,
    scope: 'openid profile email',
  },
  signInReturnToPath: '/admin',
})

export async function getSession() {
  return auth0.getSession()
}

/** Decode JWT payload without verification (for reading claims only). */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const [, payloadB64] = token.split('.')
    if (!payloadB64) return {}
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8')
    return JSON.parse(payloadJson) as Record<string, unknown>
  } catch {
    return {}
  }
}

const USER_METADATA_CLAIM = 'https://www.scoop-afrique.com/user_metadata'

/** User metadata from Auth0 (stored in user_metadata, added to access token by Post-Login Action). */
export interface UserMetadataFromToken {
  family_name?: string
  given_name?: string
  phone_number?: string
  sexe?: string
  adress?: string
  /** Our canonical keys (from profile form) */
  name?: string
  address?: string
  phone?: string
  sex?: string
}

/**
 * Extracts user_metadata from the access token payload.
 * The metadata lives in the access token (getAccessToken), not in getSession().
 */
export async function getAccessTokenPayload(): Promise<Record<string, unknown> | null> {
  const result = await getAccessToken()
  if (!result?.accessToken) return null
  return decodeJwtPayload(result.accessToken)
}

/**
 * Extracts user_metadata from the access token and normalizes to our UserMetadata shape.
 * Maps: given_name + family_name -> name, adress -> address, phone_number -> phone, sexe -> sex.
 */
export function getUserMetadataFromPayload(payload: Record<string, unknown>): UserMetadataFromToken {
  const raw = (payload[USER_METADATA_CLAIM] ?? {}) as Record<string, unknown>
  const m = raw as UserMetadataFromToken
  return {
    ...m,
    name:
      ((m.name as string) ?? ([m.given_name, m.family_name].filter(Boolean).join(' ').trim() || undefined)),
    address: (m.address as string) ?? (m.adress as string) ?? undefined,
    phone: (m.phone as string) ?? (m.phone_number as string) ?? undefined,
    sex: (m.sex as string) ?? (m.sexe as string) ?? undefined,
  }
}

/**
 * Returns the access token for the configured API (AUTH0_AUDIENCE).
 * SDK returns { token, scope, expiresAt, token_type, audience }; we normalize to
 * { accessToken, permissions } so callers can use .accessToken and .permissions.
 * permissions are read from the JWT payload (set by Auth0 when RBAC is enabled).
 */
export async function getAccessToken(): Promise<{
  accessToken: string
  permissions?: string[]
  token?: string
  scope?: string
  expiresAt?: number
  audience?: string
} | null> {
  try {
    const result = await auth0.getAccessToken()
    if (!result?.token) return null
    const payload = decodeJwtPayload(result.token)
    const permissions = payload.permissions as string[] | undefined
    return {
      ...result,
      accessToken: result.token,
      token: result.token,
      permissions: Array.isArray(permissions) ? permissions : undefined,
    }
  } catch {
    return null
  }
}

export type AdminUser = {
  sub: string
  email?: string
  name?: string
  picture?: string
  permissions?: string[]
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getSession()
  if (!session?.user) return null
  const token = await getAccessToken()
  const permissions = (token?.permissions as string[] | undefined) ?? []
  return {
    sub: session.user.sub,
    email: session.user.email,
    name: session.user.name,
    picture: session.user.picture,
    permissions,
  }
}
