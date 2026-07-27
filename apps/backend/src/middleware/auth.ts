/**
 * Auth middleware — attaches authenticated user to context or rejects 401/503.
 * Role guard factory for fine-grained access control.
 */
import type { Context, Next } from 'hono'
import {
  createGetAuthUser,
  getBearerToken,
  type AuthUser,
  type AuthUserResult,
} from '../lib/auth.js'
import { config } from '../config/env.js'
import { logger } from '../lib/logger.js'
import type { AppRole } from '../services/profile.service.js'

/**
 * Require authentication. Sets `user` on context.
 * Returns 503 if a Bearer token was sent but Auth0 is not configured (env hint).
 */
export function createRequireAuth(
  dependencies: {
    resolveUser: (c: Context) => Promise<AuthUserResult>
    isAuth0Configured: () => boolean
  } = {
    resolveUser: createGetAuthUser(),
    isAuth0Configured: () => config.auth0 !== null,
  },
) {
  return async function requireAuth(c: Context, next: Next) {
    const path = c.req.path
    const token = getBearerToken(c)
    if (!token) {
      logger.authFail(path, 'NO_TOKEN', 'Missing Authorization: Bearer header')
      return c.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, 401)
    }
    if (!dependencies.isAuth0Configured()) {
      return c.json(
        { error: 'Auth0 not configured', code: 'CONFIG' },
        503,
      )
    }
    const result = await dependencies.resolveUser(c)
    if (!result.ok) {
      if (result.reason === 'AUTH_PROVIDER_UNAVAILABLE') {
        logger.authFail(path, 'AUTH_PROVIDER_UNAVAILABLE')
        return c.json(
          {
            error: 'Authentication provider unavailable',
            code: result.reason,
          },
          503,
        )
      }
      logger.authFail(path, 'INVALID_TOKEN', result.reason)
      return c.json({ error: 'Unauthorized', code: 'INVALID_TOKEN' }, 401)
    }

    logger.authOk(path, result.user.email, result.user.role)
    c.set('user' as never, result.user as never)
    await next()
  }
}

export const requireAuth = createRequireAuth()

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

export function requirePermission(...permissions: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user' as never) as AuthUser | undefined
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    if (!permissions.every((permission) => user.permissions.includes(permission))) {
      logger.authFail(c.req.path, 'INSUFFICIENT_PERMISSION', permissions.join(','))
      return c.json(
        { error: 'Forbidden', code: 'INSUFFICIENT_PERMISSION' },
        403,
      )
    }
    await next()
  }
}
