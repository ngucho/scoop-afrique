/**
 * Reader subscriber preferences (Auth0 reader app users).
 */
import { eq } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { readerSubscribers } from '../db/schema.js'
import { config } from '../config/env.js'
import type { digestFrequencySchema } from '../schemas/reader.js'
import type { z } from 'zod'

export type DigestFrequency = z.infer<typeof digestFrequencySchema>

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function randomToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setUTCDate(x.getUTCDate() + n)
  return x
}

/** Next send window start (UTC) from now for the given cadence. */
export function computeNextDigestAt(
  frequency: DigestFrequency,
  from: Date = new Date(),
): Date | null {
  if (frequency === 'off') return null
  if (frequency === 'daily') return addDays(from, 1)
  if (frequency === 'weekly') return addDays(from, 7)
  return addDays(from, 30)
}

export interface ReaderSubscriberRow {
  auth0_sub: string
  email: string
  topic_category_ids: string[]
  digest_frequency: DigestFrequency
  unsubscribed_at: string | null
  unsubscribe_token: string
  next_digest_at: string | null
  created_at: string
  updated_at: string
}

function toRow(r: typeof readerSubscribers.$inferSelect): ReaderSubscriberRow {
  return {
    auth0_sub: r.auth0Sub,
    email: r.email,
    topic_category_ids: r.topicCategoryIds ?? [],
    digest_frequency: r.digestFrequency as DigestFrequency,
    unsubscribed_at: r.unsubscribedAt?.toISOString() ?? null,
    unsubscribe_token: r.unsubscribeToken,
    next_digest_at: r.nextDigestAt?.toISOString() ?? null,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }
}

export async function getOrCreateReaderSubscriber(
  auth0Sub: string,
  email: string,
): Promise<ReaderSubscriberRow> {
  if (!config.database) {
    const token = randomToken()
    return {
      auth0_sub: auth0Sub,
      email,
      topic_category_ids: [],
      digest_frequency: 'weekly',
      unsubscribed_at: null,
      unsubscribe_token: token,
      next_digest_at: computeNextDigestAt('weekly')?.toISOString() ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  const db = getDb()
  const normalized = normalizeEmail(email)

  const [existing] = await db
    .select()
    .from(readerSubscribers)
    .where(eq(readerSubscribers.auth0Sub, auth0Sub))
    .limit(1)

  if (existing) {
    const emailChanged = normalizeEmail(existing.email) !== normalized
    if (emailChanged) {
      const [updated] = await db
        .update(readerSubscribers)
        .set({
          email,
          emailNormalized: normalized,
          updatedAt: new Date(),
        })
        .where(eq(readerSubscribers.auth0Sub, auth0Sub))
        .returning()
      return toRow(updated ?? existing)
    }
    return toRow(existing)
  }

  const unsubToken = randomToken()
  const freq: DigestFrequency = 'weekly'
  const nextAt = computeNextDigestAt(freq)

  const [created] = await db
    .insert(readerSubscribers)
    .values({
      auth0Sub,
      email,
      emailNormalized: normalized,
      topicCategoryIds: [],
      digestFrequency: freq,
      unsubscribeToken: unsubToken,
      nextDigestAt: nextAt,
    })
    .returning()

  if (!created) throw new Error('Failed to create reader subscriber')
  return toRow(created)
}

export async function updateReaderSubscriber(
  auth0Sub: string,
  patch: { topicCategoryIds?: string[]; digestFrequency?: DigestFrequency },
): Promise<ReaderSubscriberRow | null> {
  if (!config.database) return null
  const db = getDb()

  const [current] = await db
    .select()
    .from(readerSubscribers)
    .where(eq(readerSubscribers.auth0Sub, auth0Sub))
    .limit(1)
  if (!current) return null

  let nextDigestAt: Date | null = current.nextDigestAt
  let unsubscribedAt: Date | null = current.unsubscribedAt

  if (patch.digestFrequency !== undefined) {
    if (patch.digestFrequency === 'off') {
      unsubscribedAt = new Date()
      nextDigestAt = null
    } else {
      unsubscribedAt = null
      nextDigestAt = computeNextDigestAt(patch.digestFrequency)
    }
  }

  const [updated] = await db
    .update(readerSubscribers)
    .set({
      topicCategoryIds: patch.topicCategoryIds ?? current.topicCategoryIds,
      ...(patch.digestFrequency !== undefined
        ? {
            digestFrequency: patch.digestFrequency,
            unsubscribedAt,
            nextDigestAt,
          }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(readerSubscribers.auth0Sub, auth0Sub))
    .returning()

  return updated ? toRow(updated) : null
}

export async function unsubscribeReaderByToken(token: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [row] = await db
    .update(readerSubscribers)
    .set({
      digestFrequency: 'off',
      unsubscribedAt: new Date(),
      nextDigestAt: null,
      updatedAt: new Date(),
    })
    .where(eq(readerSubscribers.unsubscribeToken, token))
    .returning({ auth0Sub: readerSubscribers.auth0Sub })
  return !!row
}

export async function getReaderByToken(token: string): Promise<ReaderSubscriberRow | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .select()
    .from(readerSubscribers)
    .where(eq(readerSubscribers.unsubscribeToken, token))
    .limit(1)
  return row ? toRow(row) : null
}
