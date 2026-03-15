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
  signInReturnToPath: '/dashboard',
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
