/**
 * Auth0 client for reader (subscriber) accounts — separate cookie + routes from admin.
 * Env: READER_AUTH0_CLIENT_ID, READER_AUTH0_CLIENT_SECRET, optional READER_AUTH0_SECRET.
 * Same API audience as admin (AUTH0_AUDIENCE) so the backend accepts the access token.
 */
import { Auth0Client } from '@auth0/nextjs-auth0/server'

export const readerAuth0 = new Auth0Client({
  domain: process.env.READER_AUTH0_DOMAIN ?? process.env.AUTH0_DOMAIN,
  /** Reader SPA credentials — empty string prevents falling back to admin Auth0 app env vars. */
  clientId: process.env.READER_AUTH0_CLIENT_ID ?? '',
  clientSecret: process.env.READER_AUTH0_CLIENT_SECRET ?? '',
  secret: process.env.READER_AUTH0_SECRET ?? process.env.AUTH0_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE ?? undefined,
    scope: 'openid profile email',
  },
  signInReturnToPath: '/account',
  session: {
    cookie: {
      name: '__session_reader',
    },
  },
  transactionCookie: {
    prefix: '__txn_reader_',
  },
  routes: {
    login: '/reader/auth/login',
    callback: '/reader/auth/callback',
    logout: '/reader/auth/logout',
  },
})

export async function getReaderSession() {
  return readerAuth0.getSession()
}

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

export async function getReaderAccessToken(): Promise<{
  accessToken: string
  permissions?: string[]
} | null> {
  try {
    const result = await readerAuth0.getAccessToken()
    if (!result?.token) return null
    const payload = decodeJwtPayload(result.token)
    const permissions = payload.permissions as string[] | undefined
    return {
      accessToken: result.token,
      permissions: Array.isArray(permissions) ? permissions : undefined,
    }
  } catch {
    return null
  }
}
