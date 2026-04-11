/**
 * Auth0 client for reader (subscriber) accounts — separate cookie + routes from admin.
 * Env: READER_AUTH0_* or fall back to AUTH0_CLIENT_ID / AUTH0_CLIENT_SECRET (same Auth0 app).
 * Optional READER_AUTH0_SECRET; same API audience (AUTH0_AUDIENCE) as admin.
 */
import { Auth0Client } from '@auth0/nextjs-auth0/server'

const readerClientId =
  process.env.READER_AUTH0_CLIENT_ID?.trim() || process.env.AUTH0_CLIENT_ID?.trim() || ''
const readerClientSecret =
  process.env.READER_AUTH0_CLIENT_SECRET?.trim() || process.env.AUTH0_CLIENT_SECRET?.trim() || ''

export const readerAuth0 = new Auth0Client({
  domain: process.env.READER_AUTH0_DOMAIN ?? process.env.AUTH0_DOMAIN,
  clientId: readerClientId,
  clientSecret: readerClientSecret,
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
