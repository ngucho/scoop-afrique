import { createHash, randomBytes } from 'node:crypto'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { journalistApiKeys, profiles } from '../db/schema.js'
import { config } from '../config/env.js'
import type { AppRole } from './profile.service.js'

const KEY_PREFIX = 'saw_'

export function hashWriterApiKey(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex')
}

function canUseWriterApi(role: AppRole): boolean {
  return ['journalist', 'editor', 'manager', 'admin'].includes(role)
}

export async function createWriterApiKey(
  profileId: string,
  label: string,
): Promise<{ id: string; raw_key: string; key_prefix: string } | null> {
  if (!config.database) return null
  const db = getDb()
  const secret = randomBytes(24).toString('hex')
  const rawKey = `${KEY_PREFIX}${secret}`
  const keyHash = hashWriterApiKey(rawKey)
  const keyPrefix = rawKey.slice(0, 14)

  const [row] = await db
    .insert(journalistApiKeys)
    .values({
      profileId,
      keyPrefix,
      keyHash,
      label: label.trim() || 'Clé',
    })
    .returning()

  if (!row) return null
  return { id: row.id, raw_key: rawKey, key_prefix: keyPrefix }
}

export async function listWriterApiKeys(profileId: string) {
  if (!config.database) return []
  const db = getDb()
  return db
    .select({
      id: journalistApiKeys.id,
      key_prefix: journalistApiKeys.keyPrefix,
      label: journalistApiKeys.label,
      last_used_at: journalistApiKeys.lastUsedAt,
      revoked_at: journalistApiKeys.revokedAt,
      created_at: journalistApiKeys.createdAt,
    })
    .from(journalistApiKeys)
    .where(eq(journalistApiKeys.profileId, profileId))
    .orderBy(desc(journalistApiKeys.createdAt))
}

export async function revokeWriterApiKey(keyId: string, profileId: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [row] = await db
    .update(journalistApiKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(journalistApiKeys.id, keyId),
        eq(journalistApiKeys.profileId, profileId),
        isNull(journalistApiKeys.revokedAt),
      ),
    )
    .returning({ id: journalistApiKeys.id })
  return !!row
}

/** Validate raw Bearer token; updates last_used_at. Returns profile id or null. */
export async function validateWriterApiKey(rawKey: string): Promise<string | null> {
  if (!rawKey.startsWith(KEY_PREFIX) || rawKey.length < KEY_PREFIX.length + 16) return null
  if (!config.database) return null
  const db = getDb()
  const keyHash = hashWriterApiKey(rawKey)
  const [row] = await db
    .select({
      id: journalistApiKeys.id,
      profileId: journalistApiKeys.profileId,
    })
    .from(journalistApiKeys)
    .where(and(eq(journalistApiKeys.keyHash, keyHash), isNull(journalistApiKeys.revokedAt)))
    .limit(1)
  if (!row) return null

  await db
    .update(journalistApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(journalistApiKeys.id, row.id))

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, row.profileId))
    .limit(1)
  if (!profile || !canUseWriterApi(profile.role as AppRole)) return null

  return row.profileId
}
