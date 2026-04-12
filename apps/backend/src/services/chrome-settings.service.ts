import { eq } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { readerChromeSettings } from '../db/schema.js'
import { config } from '../config/env.js'

const SINGLETON = 'default'

export interface ChromeSettingsDto {
  empty_ad_title: string | null
  empty_ad_subtitle: string | null
  updated_at: string
}

function rowToDto(row: typeof readerChromeSettings.$inferSelect): ChromeSettingsDto {
  return {
    empty_ad_title: row.emptyAdTitle ?? null,
    empty_ad_subtitle: row.emptyAdSubtitle ?? null,
    updated_at: row.updatedAt.toISOString(),
  }
}

export async function getPublicChromeFallbackCopy(): Promise<{
  title: string | null
  subtitle: string | null
}> {
  if (!config.database) return { title: null, subtitle: null }
  const db = getDb()
  const [row] = await db
    .select()
    .from(readerChromeSettings)
    .where(eq(readerChromeSettings.singletonKey, SINGLETON))
    .limit(1)
  if (!row) return { title: null, subtitle: null }
  return {
    title: row.emptyAdTitle ?? null,
    subtitle: row.emptyAdSubtitle ?? null,
  }
}

export async function getChromeSettingsAdmin(): Promise<ChromeSettingsDto | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .select()
    .from(readerChromeSettings)
    .where(eq(readerChromeSettings.singletonKey, SINGLETON))
    .limit(1)
  return row ? rowToDto(row) : null
}

export async function upsertChromeSettings(patch: {
  empty_ad_title?: string | null
  empty_ad_subtitle?: string | null
}): Promise<ChromeSettingsDto | null> {
  if (!config.database) return null
  const db = getDb()
  const [existing] = await db
    .select()
    .from(readerChromeSettings)
    .where(eq(readerChromeSettings.singletonKey, SINGLETON))
    .limit(1)

  if (!existing) {
    const [inserted] = await db
      .insert(readerChromeSettings)
      .values({
        singletonKey: SINGLETON,
        emptyAdTitle: patch.empty_ad_title ?? null,
        emptyAdSubtitle: patch.empty_ad_subtitle ?? null,
        updatedAt: new Date(),
      })
      .returning()
    return inserted ? rowToDto(inserted) : null
  }

  const [row] = await db
    .update(readerChromeSettings)
    .set({
      ...(patch.empty_ad_title !== undefined ? { emptyAdTitle: patch.empty_ad_title } : {}),
      ...(patch.empty_ad_subtitle !== undefined ? { emptyAdSubtitle: patch.empty_ad_subtitle } : {}),
      updatedAt: new Date(),
    })
    .where(eq(readerChromeSettings.singletonKey, SINGLETON))
    .returning()
  return row ? rowToDto(row) : null
}
