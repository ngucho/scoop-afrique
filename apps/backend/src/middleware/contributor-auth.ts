/**
 * Accept staff JWT or reader JWT for community actions (Tribune, votes, etc.).
 */
import type { Context, Next } from 'hono'
import { getBearerToken } from '../lib/auth.js'
import { verifyAuth0Token, verifyReaderAuth0Token } from '../lib/auth0.js'
import { getOrCreateProfile } from '../services/profile.service.js'
import { config } from '../config/env.js'
import { logger } from '../lib/logger.js'

export interface ContributorContext {
  profileId: string
  auth0Sub: string
  email: string
  isReader: boolean
}

export async function requireContributorAuth(c: Context, next: Next) {
  const path = c.req.path
  const token = getBearerToken(c)
  if (!token) {
    logger.authFail(path, 'NO_TOKEN', 'Missing Authorization: Bearer header')
    return c.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, 401)
  }
  if (!config.auth0) {
    return c.json(
      {
        error: 'Auth0 not configured',
        code: 'CONFIG',
        hint: 'Set AUTH0_DOMAIN and AUTH0_AUDIENCE in the backend .env',
      },
      503,
    )
  }

  const reader = verifyReaderAuth0Token(token)
  if (reader) {
    const profile = await getOrCreateProfile({
      sub: reader.sub,
      email: reader.email,
      role: 'journalist',
    })
    c.set('contributor' as never, {
      profileId: profile.id,
      auth0Sub: reader.sub,
      email: reader.email,
      isReader: true,
    } satisfies ContributorContext as never)
    await next()
    return
  }

  const staff = verifyAuth0Token(token)
  if (staff) {
    return c.json(
      {
        error:
          'La Tribune nécessite un compte lecteur (permission access:reader, sans accès rédaction seul). Utilisez votre compte abonné ou le backoffice.',
        code: 'TRIBUNE_READER_TOKEN_REQUIRED',
      },
      403,
    )
  }

  logger.authFail(path, 'INVALID_TOKEN', 'Contributor auth requires a valid reader token')
  return c.json({ error: 'Unauthorized', code: 'INVALID_TOKEN' }, 401)
}

/** Optional: same verification but does not 401 if missing — for optional personalization. */
export async function optionalContributorAuth(c: Context, next: Next) {
  const token = getBearerToken(c)
  if (!token || !config.auth0) {
    await next()
    return
  }
  const reader = verifyReaderAuth0Token(token)
  if (reader) {
    const profile = await getOrCreateProfile({
      sub: reader.sub,
      email: reader.email,
      role: 'journalist',
    })
    c.set('contributor' as never, {
      profileId: profile.id,
      auth0Sub: reader.sub,
      email: reader.email,
      isReader: true,
    } satisfies ContributorContext as never)
    await next()
    return
  }
  const staff = verifyAuth0Token(token)
  if (staff) {
    // Staff JWT: do not attach a Tribune viewer (would bypass reader-only rules).
  }
  await next()
}
