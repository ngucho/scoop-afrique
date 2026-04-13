/**
 * Reader routes JWT — same API audience.
 * - Prefer `access:reader` (with or without staff perms).
 * - Fallback: valid staff token so comptes « rédaction seule » sur la session lecteur
 *   peuvent charger /reader/me et se déconnecter (cookie `__session_reader`).
 */
import type { Context } from 'hono'
import { inspectTokenForReaderRoutes } from './auth0.js'
import { getBearerToken } from './auth.js'

export interface ReaderAuthUser {
  sub: string
  email: string
}

export async function getReaderAuthUser(c: Context): Promise<ReaderAuthUser | null> {
  const token = getBearerToken(c)
  if (!token) return null
  const r = inspectTokenForReaderRoutes(token)
  return r.ok ? r.user : null
}
