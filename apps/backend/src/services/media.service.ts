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

/* ---------- Upload image to Supabase Storage ---------- */

export async function uploadImage(
  file: File | Blob,
  filename: string,
  uploadedBy: string,
  options?: { alt?: string; caption?: string }
): Promise<MediaRecord> {
  if (!config.supabase) throw new Error('Supabase not configured')
  const supabase = getSupabase()

  // Ensure bucket exists (idempotent)
  await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  }).catch(() => {}) // Bucket may already exist

  // Generate unique path
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: (file as File).type || 'image/jpeg',
      upsert: false,
    })
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  // Get public URL
  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  const url = publicUrl.publicUrl

  // Save record in media table (optional, for backoffice management)
  const { data, error } = await supabase
    .from('media')
    .insert({
      url,
      storage_path: storagePath,
      alt: options?.alt ?? null,
      caption: options?.caption ?? null,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  if (error) {
    // If media table doesn't exist yet, return inline
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
  return data as MediaRecord
}

/* ---------- Register an external image URL ---------- */

export async function registerImageUrl(
  url: string,
  uploadedBy: string,
  options?: { alt?: string; caption?: string }
): Promise<MediaRecord> {
  if (!config.supabase) {
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
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('media')
    .insert({
      url,
      storage_path: null,
      alt: options?.alt ?? null,
      caption: options?.caption ?? null,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  if (error) {
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
  return data as MediaRecord
}

/* ---------- List media (admin) ---------- */

export async function listMedia(options: {
  page?: number
  limit?: number
}): Promise<{ data: MediaRecord[]; total: number }> {
  if (!config.supabase) return { data: [], total: 0 }
  const supabase = getSupabase()
  const limit = Math.min(options.limit ?? 30, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  const { data, error, count } = await supabase
    .from('media')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { data: [], total: 0 }
  return { data: (data ?? []) as MediaRecord[], total: count ?? 0 }
}

/* ---------- Delete media ---------- */

export async function deleteMedia(id: string): Promise<boolean> {
  if (!config.supabase) return false
  const supabase = getSupabase()

  // Get record to delete storage file
  const { data: record } = await supabase.from('media').select('storage_path').eq('id', id).single()
  if (!record) return false

  if (record.storage_path) {
    await supabase.storage.from(BUCKET).remove([record.storage_path]).catch(() => {})
  }

  const { error } = await supabase.from('media').delete().eq('id', id)
  return !error
}
