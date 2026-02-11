/**
 * Admin profile routes — password change and user_metadata updates via Auth0.
 *
 * - PATCH /admin/profile/me/metadata — update Auth0 user_metadata (name, address, phone, sex)
 * - POST  /admin/profile/me/password — change password (Auth0 database users only)
 *
 * Personal information is managed exclusively in Auth0 (IAM).
 * The frontend reads user_metadata from the Auth0 session / JWT custom claims.
 */
import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth.js'
import { setAuth0UserPassword, updateAuth0UserMetadata } from '../../lib/auth0-management.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

/** Allowed user_metadata keys (whitelist). */
const ALLOWED_METADATA_KEYS = ['name', 'address', 'phone', 'sex'] as const

/** PATCH /admin/profile/me/metadata — update Auth0 user_metadata fields. */
app.patch('/me/metadata', requireAuth, async (c) => {
  const user = c.get('user')
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

  const metadata: Record<string, string> = {}
  for (const key of ALLOWED_METADATA_KEYS) {
    if (typeof body[key] === 'string') {
      metadata[key] = (body[key] as string).trim()
    }
  }

  if (Object.keys(metadata).length === 0) {
    return c.json({ error: 'No valid fields provided. Allowed: name, address, phone, sex.' }, 400)
  }

  const ok = await updateAuth0UserMetadata(user.auth0_id, metadata)
  if (!ok) {
    return c.json({ error: 'Failed to update user metadata in Auth0.' }, 500)
  }

  return c.json({ data: metadata })
})

/** POST /admin/profile/me/password — change password (Auth0 database users only). */
app.post('/me/password', requireAuth, async (c) => {
  const user = c.get('user')
  const body = (await c.req.json().catch(() => ({}))) as { password?: string }

  const password = typeof body.password === 'string' ? body.password.trim() : ''
  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters.' }, 400)
  }

  const ok = await setAuth0UserPassword(user.auth0_id, password)
  if (!ok) {
    return c.json({
      error:
        'Could not update password. Only database users can change password here; social login users must use their provider.',
    }, 400)
  }

  return c.json({ data: { success: true } })
})

export default app
