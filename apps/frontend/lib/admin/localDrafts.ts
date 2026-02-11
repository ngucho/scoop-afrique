'use client'

/**
 * Local draft persistence using IndexedDB (via idb-keyval).
 * Saves article drafts locally to prevent data loss from:
 * - Power outages
 * - Connection loss
 * - Browser crashes
 *
 * Each draft is keyed by article ID (or 'new' for new articles).
 */
import { get, set, del, keys } from 'idb-keyval'

export interface LocalDraft {
  /** Article ID or 'new' for unsaved articles */
  articleId: string
  title: string
  excerpt: string
  content: unknown
  updatedAt: number // Date.now()
}

const PREFIX = 'scoop-draft-'

function draftKey(articleId: string): string {
  return `${PREFIX}${articleId}`
}

/** Save a draft to IndexedDB. */
export async function saveDraft(draft: LocalDraft): Promise<void> {
  try {
    await set(draftKey(draft.articleId), {
      ...draft,
      updatedAt: Date.now(),
    })
  } catch {
    // Silently fail — draft saving is non-critical
  }
}

/** Get a draft from IndexedDB. Returns null if not found. */
export async function getDraft(articleId: string): Promise<LocalDraft | null> {
  try {
    const val = await get<LocalDraft>(draftKey(articleId))
    return val ?? null
  } catch {
    return null
  }
}

/** Delete a draft from IndexedDB. */
export async function deleteDraft(articleId: string): Promise<void> {
  try {
    await del(draftKey(articleId))
  } catch {
    // Silently fail
  }
}

/** Check if a local draft exists and is newer than the server version. */
export async function hasNewerDraft(
  articleId: string,
  serverUpdatedAt: string | null | undefined,
): Promise<LocalDraft | null> {
  const draft = await getDraft(articleId)
  if (!draft) return null

  if (!serverUpdatedAt) return draft // No server version → local is newer

  const serverTime = new Date(serverUpdatedAt).getTime()
  if (draft.updatedAt > serverTime) return draft

  // Local draft is older — clean up
  await deleteDraft(articleId)
  return null
}

/** List all local drafts. */
export async function listDrafts(): Promise<LocalDraft[]> {
  try {
    const allKeys = await keys()
    const draftKeys = allKeys.filter(
      (k) => typeof k === 'string' && k.startsWith(PREFIX),
    )
    const drafts: LocalDraft[] = []
    for (const key of draftKeys) {
      const val = await get<LocalDraft>(key as string)
      if (val) drafts.push(val)
    }
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}
