/**
 * Auth middleware — attaches authenticated user to context or rejects 401/503.
 * Role guard factory for fine-grained access control.
 */
import type { Context, Next } from 'hono'
import { getAuthUser, getBearerToken, type AuthUser } from '../lib/auth.js'
import { config } from '../config/env.js'
import { logger } from '../lib/logger.js'
import type { AppRole } from '../services/profile.service.js'

/**
 * Require authentication. Sets `user` on context.
 * Returns 503 if a Bearer token was sent but Auth0 is not configured (env hint).
 */
export async function requireAuth(c: Context, next: Next) {
  const path = c.req.path
  const token = getBearerToken(c)

  if (!token) {
    logger.authFail(path, 'NO_TOKEN', 'Missing Authorization: Bearer header')
    return c.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, 401)
  }

  if (!config.auth0) {
    logger.authFail(path, 'CONFIG', 'AUTH0_DOMAIN or AUTH0_AUDIENCE not set in .env')
    return c.json(
      {
        error: 'Auth0 not configured',
        code: 'CONFIG',
        hint: 'Set AUTH0_DOMAIN and AUTH0_AUDIENCE in the backend .env',
      },
      503
    )
  }

  const user = await getAuthUser(c)
  if (!user) {
    logger.authFail(path, 'INVALID_TOKEN', 'Token invalid, expired, or audience mismatch')
    return c.json(
      { error: 'Unauthorized', code: 'INVALID_TOKEN' },
      401
    )
  }

  logger.authOk(path, user.email, user.role)
  c.set('user' as never, user as never)
  await next()
}

/**
 * Factory: require one of the given roles.
 * Must be used AFTER requireAuth.
 */
export function requireRole(...roles: AppRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user' as never) as AuthUser | undefined
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    await next()
  }
}
