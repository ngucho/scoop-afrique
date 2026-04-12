/**
 * Admin profile routes — password change and user_metadata updates via Auth0.
 *
 * - PATCH /admin/profile/me/metadata — update Auth0 user_metadata (name, address, phone, sex)
 * - POST  /admin/profile/me/password — change password (Auth0 database users only)
 *
 * Personal information is managed exclusively in Auth0 (IAM).
 * The frontend reads user_metadata from the Auth0 session / JWT custom claims.
 */
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth.js'
import { config } from '../../config/env.js'
import { getDb } from '../../db/index.js'
import { profiles } from '../../db/schema.js'
import {
  patchAuth0User,
  setAuth0UserPassword,
  updateAuth0UserMetadata,
} from '../../lib/auth0-management.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

/** Allowed user_metadata keys (whitelist). Synced to profiles for public author card where noted. */
const ALLOWED_METADATA_KEYS = [
  'name',
  'address',
  'phone',
  'sex',
  'public_bio',
  'public_avatar_url',
  'contact_private',
  'preferences',
] as const

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
    return c.json(
      {
        error:
          'No valid fields provided. Allowed: name, address, phone, sex, public_bio, public_avatar_url, contact_private, preferences.',
      },
      400,
    )
  }

  const ok = await updateAuth0UserMetadata(user.auth0_id, metadata)
  if (!ok) {
    return c.json({ error: 'Failed to update user metadata in Auth0.' }, 500)
  }

  if (metadata.public_avatar_url !== undefined) {
    const pic = metadata.public_avatar_url.trim()
    if (pic.length > 0) {
      await patchAuth0User(user.auth0_id, { picture: pic })
    }
  }

  if (config.database) {
    const hasJournalistSync =
      metadata.public_bio !== undefined ||
      metadata.public_avatar_url !== undefined ||
      metadata.contact_private !== undefined ||
      metadata.preferences !== undefined
    if (hasJournalistSync) {
      const db = getDb()
      const patch: Partial<typeof profiles.$inferInsert> = { updatedAt: new Date() }
      if (metadata.public_bio !== undefined) patch.journalistPublicBio = metadata.public_bio || null
      if (metadata.public_avatar_url !== undefined)
        patch.journalistPublicAvatarUrl = metadata.public_avatar_url || null
      if (metadata.contact_private !== undefined)
        patch.journalistContactPrivate = metadata.contact_private || null
      if (metadata.preferences !== undefined) patch.journalistPreferences = metadata.preferences || null
      await db.update(profiles).set(patch).where(eq(profiles.id, user.id))
    }
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
