/**
 * Media service — image upload to Supabase Storage + external URL support.
 *
 * Strategy:
 *   - Images: upload to Supabase Storage bucket "images", OR store external URL
 *   - Videos: NEVER uploaded — only YouTube embed URLs stored on articles
 *
 * The "media" table is optional (for image management in backoffice).
 * Articles reference cover images directly by URL (cover_image_url).
 */
import { eq, count, desc } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { media } from '../db/schema.js'
import { getSupabase } from '../lib/supabase.js'
import { config } from '../config/env.js'
import crypto from 'node:crypto'

const BUCKET = 'images'

export interface MediaRecord {
  id: string
  url: string
  storage_path: string | null
  alt: string | null
  caption: string | null
  uploaded_by: string
  created_at: string
}

function toMediaRecord(row: { id: string; url: string; storagePath: string | null; alt: string | null; caption: string | null; uploadedBy: string; createdAt: Date }): MediaRecord {
  return {
    id: row.id,
    url: row.url,
    storage_path: row.storagePath,
    alt: row.alt,
    caption: row.caption,
    uploaded_by: row.uploadedBy,
    created_at: row.createdAt.toISOString(),
  }
}

/* ---------- Upload image to Supabase Storage ---------- */

export async function uploadImage(
  file: File | Blob,
  filename: string,
  uploadedBy: string,
  options?: { alt?: string; caption?: string }
): Promise<MediaRecord> {
  if (!config.supabase) throw new Error('Storage not configured (SUPABASE_SERVICE_ROLE_KEY)')
  const supabase = getSupabase()

  await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  }).catch(() => {})

  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: (file as File).type || 'image/jpeg',
      upsert: false,
    })
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  const url = publicUrl.publicUrl

  if (!config.database) {
    return {
      id: crypto.randomUUID(),
      url,
      storage_path: storagePath,
      alt: options?.alt ?? null,
      caption: options?.caption ?? null,
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
    }
  }

  const db = getDb()
  const [row] = await db
    .insert(media)
    .values({
      url,
      storagePath,
      alt: options?.alt ?? null,
      caption: options?.caption ?? null,
      uploadedBy,
    })
    .returning()

  return row ? toMediaRecord(row) : {
    id: crypto.randomUUID(),
    url,
    storage_path: storagePath,
    alt: options?.alt ?? null,
    caption: options?.caption ?? null,
    uploaded_by: uploadedBy,
    created_at: new Date().toISOString(),
  }
}

/* ---------- Register an external image URL ---------- */

export async function registerImageUrl(
  url: string,
  uploadedBy: string,
  options?: { alt?: string; caption?: string }
): Promise<MediaRecord> {
  if (!config.database) {
    return {
      id: crypto.randomUUID(),
      url,
      storage_path: null,
      alt: options?.alt ?? null,
      caption: options?.caption ?? null,
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
    }
  }
  const db = getDb()
  const [row] = await db
    .insert(media)
    .values({
      url,
      storagePath: null,
      alt: options?.alt ?? null,
      caption: options?.caption ?? null,
      uploadedBy,
    })
    .returning()

  return row ? toMediaRecord(row) : {
    id: crypto.randomUUID(),
    url,
    storage_path: null,
    alt: options?.alt ?? null,
    caption: options?.caption ?? null,
    uploaded_by: uploadedBy,
    created_at: new Date().toISOString(),
  }
}

/* ---------- List media (admin) ---------- */

export async function listMedia(options: {
  page?: number
  limit?: number
}): Promise<{ data: MediaRecord[]; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const limit = Math.min(options.limit ?? 30, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  const [totalRow] = await db.select({ count: count() }).from(media)
  const rows = await db
    .select()
    .from(media)
    .orderBy(desc(media.createdAt))
    .limit(limit)
    .offset(offset)

  return {
    data: rows.map(toMediaRecord),
    total: totalRow?.count ?? 0,
  }
}

/* ---------- Delete media ---------- */

export async function deleteMedia(id: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [record] = await db.select({ storagePath: media.storagePath }).from(media).where(eq(media.id, id)).limit(1)
  if (!record) return false

  if (record.storagePath && config.supabase) {
    await getSupabase().storage.from(BUCKET).remove([record.storagePath]).catch(() => {})
  }

  const deleted = await db.delete(media).where(eq(media.id, id)).returning({ id: media.id })
  return deleted.length > 0
}
