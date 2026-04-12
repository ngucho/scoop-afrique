/**
 * Reader public profile — DB projection + optional Auth0 user_metadata sync.
 */
import { and, eq, ne, sql } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { readerPublicProfiles } from '../db/schema.js'
import { config } from '../config/env.js'
import { updateAuth0UserMetadata, patchAuth0User } from '../lib/auth0-management.js'

export interface ReaderPublicProfileDto {
  display_name: string | null
  pseudo: string | null
  avatar_url: string | null
  date_of_birth: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  postal_code: string | null
  country_code: string | null
  bio: string | null
  interest_category_ids: string[]
  created_at: string
  updated_at: string
}

function toDto(r: typeof readerPublicProfiles.$inferSelect): ReaderPublicProfileDto {
  return {
    display_name: r.displayName,
    pseudo: r.pseudo,
    avatar_url: r.avatarUrl,
    date_of_birth: r.dateOfBirth,
    address_line1: r.addressLine1,
    address_line2: r.addressLine2,
    city: r.city,
    postal_code: r.postalCode,
    country_code: r.countryCode,
    bio: r.bio,
    interest_category_ids: r.interestCategoryIds ?? [],
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }
}

export async function getReaderPublicProfile(auth0Sub: string): Promise<ReaderPublicProfileDto | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .select()
    .from(readerPublicProfiles)
    .where(eq(readerPublicProfiles.auth0Sub, auth0Sub))
    .limit(1)
  return row ? toDto(row) : null
}

export async function upsertReaderPublicProfile(
  auth0Sub: string,
  patch: Partial<{
    display_name: string | null
    pseudo: string | null
    avatar_url: string | null
    date_of_birth: string | null
    address_line1: string | null
    address_line2: string | null
    city: string | null
    postal_code: string | null
    country_code: string | null
    bio: string | null
    interest_category_ids: string[]
  }>,
  options?: { syncAuth0?: boolean },
): Promise<ReaderPublicProfileDto> {
  if (!config.database) {
    return {
      display_name: patch.display_name ?? null,
      pseudo: patch.pseudo ?? null,
      avatar_url: patch.avatar_url ?? null,
      date_of_birth: patch.date_of_birth ?? null,
      address_line1: patch.address_line1 ?? null,
      address_line2: patch.address_line2 ?? null,
      city: patch.city ?? null,
      postal_code: patch.postal_code ?? null,
      country_code: patch.country_code ?? null,
      bio: patch.bio ?? null,
      interest_category_ids: patch.interest_category_ids ?? [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  const db = getDb()
  const existing = await getReaderPublicProfile(auth0Sub)
  const now = new Date()

  const merged = {
    displayName: patch.display_name !== undefined ? patch.display_name : existing?.display_name ?? null,
    pseudo: patch.pseudo !== undefined ? patch.pseudo : existing?.pseudo ?? null,
    avatarUrl: patch.avatar_url !== undefined ? patch.avatar_url : existing?.avatar_url ?? null,
    dateOfBirth:
      patch.date_of_birth !== undefined ? patch.date_of_birth : existing?.date_of_birth ?? null,
    addressLine1:
      patch.address_line1 !== undefined ? patch.address_line1 : existing?.address_line1 ?? null,
    addressLine2:
      patch.address_line2 !== undefined ? patch.address_line2 : existing?.address_line2 ?? null,
    city: patch.city !== undefined ? patch.city : existing?.city ?? null,
    postalCode: patch.postal_code !== undefined ? patch.postal_code : existing?.postal_code ?? null,
    countryCode:
      patch.country_code !== undefined ? patch.country_code : existing?.country_code ?? null,
    bio: patch.bio !== undefined ? patch.bio : existing?.bio ?? null,
    interestCategoryIds:
      patch.interest_category_ids !== undefined
        ? patch.interest_category_ids
        : existing?.interest_category_ids ?? [],
  }

  const pseudoNorm = merged.pseudo?.trim()
  if (pseudoNorm) {
    const clash = await db
      .select({ sub: readerPublicProfiles.auth0Sub })
      .from(readerPublicProfiles)
      .where(
        and(
          sql`lower(trim(${readerPublicProfiles.pseudo})) = lower(${pseudoNorm})`,
          ne(readerPublicProfiles.auth0Sub, auth0Sub),
        ),
      )
      .limit(1)
    if (clash[0]) {
      const err = new Error('PSEUDO_TAKEN')
      ;(err as Error & { code: string }).code = 'PSEUDO_TAKEN'
      throw err
    }
  }

  const [row] = await db
    .insert(readerPublicProfiles)
    .values({
      auth0Sub,
      ...merged,
      pseudo: merged.pseudo?.trim() || null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: readerPublicProfiles.auth0Sub,
      set: {
        ...merged,
        pseudo: merged.pseudo?.trim() || null,
        updatedAt: now,
      },
    })
    .returning()

  if (!row) throw new Error('upsert failed')
  const dto = toDto(row)

  if (options?.syncAuth0 !== false && config.auth0Management) {
    const meta: Record<string, unknown> = {
      display_name: dto.display_name,
      pseudo: dto.pseudo,
      date_of_birth: dto.date_of_birth,
      address: {
        line1: dto.address_line1,
        line2: dto.address_line2,
        city: dto.city,
        postal_code: dto.postal_code,
        country_code: dto.country_code,
      },
      bio: dto.bio,
      interest_category_ids: dto.interest_category_ids,
    }
    await updateAuth0UserMetadata(auth0Sub, meta)
    if (dto.display_name?.trim()) {
      await patchAuth0User(auth0Sub, { name: dto.display_name.trim() })
    }
    if (dto.avatar_url?.trim()) {
      await patchAuth0User(auth0Sub, { picture: dto.avatar_url.trim() })
    }
  }

  return dto
}
