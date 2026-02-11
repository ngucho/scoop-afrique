/**
 * Category service — CRUD for article categories.
 * CACHING: List cached for 10 minutes (categories rarely change).
 */
import { getSupabase } from '../lib/supabase.js'
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

/* ---------- List ---------- */

export async function listCategories(): Promise<Category[]> {
  if (!config.supabase) return []

  const cacheKey = 'categories:all'
  const cached = categoryCache.get(cacheKey) as Category[] | undefined
  if (cached) return cached

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  const result = (data ?? []) as Category[]
  categoryCache.set(cacheKey, result)
  return result
}

/* ---------- Get by ID or slug ---------- */

export async function getCategoryByIdOrSlug(
  idOrSlug: string
): Promise<Category | null> {
  if (!config.supabase) return null
  const supabase = getSupabase()
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    )
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq(isUuid ? 'id' : 'slug', idOrSlug)
    .single()
  if (error || !data) return null
  return data as Category
}

/* ---------- Create ---------- */

export async function createCategory(
  name: string,
  slug?: string,
  description?: string | null
): Promise<Category> {
  if (!config.supabase) throw new Error('Supabase not configured')
  const supabase = getSupabase()
  const finalSlug = slug ?? slugify(name)
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug: finalSlug, description: description ?? null })
    .select()
    .single()
  if (error) throw new Error(error.message)
  categoryCache.clear() // Invalidate list cache
  return data as Category
}

/* ---------- Update ---------- */

export async function updateCategory(
  id: string,
  body: { name?: string; slug?: string; description?: string | null }
): Promise<Category | null> {
  if (!config.supabase) return null
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('categories')
    .update(body)
    .eq('id', id)
    .select()
    .single()
  if (error) return null
  categoryCache.clear() // Invalidate list cache
  return data as Category
}

/* ---------- Delete ---------- */

export async function deleteCategory(id: string): Promise<boolean> {
  if (!config.supabase) return false
  const supabase = getSupabase()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (!error) categoryCache.clear() // Invalidate list cache
  return !error
}
