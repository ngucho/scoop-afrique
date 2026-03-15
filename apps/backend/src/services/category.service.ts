/**
 * Category service — CRUD for article categories.
 * CACHING: List cached for 10 minutes (categories rarely change).
 */
import { eq } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { categories } from '../db/schema.js'
import { config } from '../config/env.js'
import { categoryCache } from '../lib/cache.js'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toCategory(row: { id: string; name: string; slug: string; description: string | null; createdAt: Date }): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    created_at: row.createdAt.toISOString(),
  }
}

/* ---------- List ---------- */

export async function listCategories(): Promise<Category[]> {
  if (!config.database) return []

  const cacheKey = 'categories:all'
  const cached = categoryCache.get(cacheKey) as Category[] | undefined
  if (cached) return cached

  const db = getDb()
  const rows = await db.select().from(categories).orderBy(categories.name)
  const result = rows.map(toCategory)
  categoryCache.set(cacheKey, result)
  return result
}

/* ---------- Get by ID or slug ---------- */

export async function getCategoryByIdOrSlug(idOrSlug: string): Promise<Category | null> {
  if (!config.database) return null

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
  const db = getDb()
  const [row] = await db
    .select()
    .from(categories)
    .where(isUuid ? eq(categories.id, idOrSlug) : eq(categories.slug, idOrSlug))
    .limit(1)
  return row ? toCategory(row) : null
}

/* ---------- Create ---------- */

export async function createCategory(
  name: string,
  slug?: string,
  description?: string | null
): Promise<Category> {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const finalSlug = slug ?? slugify(name)
  const [row] = await db
    .insert(categories)
    .values({ name, slug: finalSlug, description: description ?? null })
    .returning()
  if (!row) throw new Error('Failed to create category')
  categoryCache.clear()
  return toCategory(row)
}

/* ---------- Update ---------- */

export async function updateCategory(
  id: string,
  body: { name?: string; slug?: string; description?: string | null }
): Promise<Category | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .update(categories)
    .set(body)
    .where(eq(categories.id, id))
    .returning()
  categoryCache.clear()
  return row ? toCategory(row) : null
}

/* ---------- Delete ---------- */

export async function deleteCategory(id: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const deleted = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id })
  categoryCache.clear()
  return deleted.length > 0
}
