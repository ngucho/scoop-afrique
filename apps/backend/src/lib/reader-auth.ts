/**
 * Reader (subscriber) JWT — same API audience, Auth0 application id (`azp`) must be the reader SPA.
 */
import type { Context } from 'hono'
import { verifyReaderAuth0Token } from './auth0.js'
import { getBearerToken } from './auth.js'

export interface ReaderAuthUser {
  sub: string
  email: string
}

export async function getReaderAuthUser(c: Context): Promise<ReaderAuthUser | null> {
  const token = getBearerToken(c)
  if (!token) return null
  const info = verifyReaderAuth0Token(token)
  if (!info) return null
  return { sub: info.sub, email: info.email }
}
