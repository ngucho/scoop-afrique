'use server'

/**
 * Server actions for admin operations.
 * These use the backend API with the Auth0 access token.
 */
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth0'
import { apiGetAuth, apiPostAuth, apiPatchAuth, apiDeleteAuth } from '@/lib/api/adminClient'
import type { Article, Comment, Category, MediaRecord, ApiResponse } from '@/lib/api/types'
import { revalidatePath } from 'next/cache'

const ADMIN_LOGIN = '/admin/login'

/** Throws redirect to admin login if no token (so user can log in). */
async function getToken(): Promise<string> {
  const t = await getAccessToken()
  if (!t?.accessToken) redirect(ADMIN_LOGIN)
  return t.accessToken
}

/* ---------- Articles ---------- */

export async function createArticle(data: Record<string, unknown>): Promise<Article> {
  const token = await getToken()
  const res = await apiPostAuth<ApiResponse<Article>>('/admin/articles', token, data)
  revalidatePath('/admin/articles')
  return res.data
}

export async function updateArticle(id: string, data: Record<string, unknown>): Promise<Article> {
  const token = await getToken()
  const res = await apiPatchAuth<ApiResponse<Article>>(`/admin/articles/${id}`, token, data)
  revalidatePath('/admin/articles')
  revalidatePath(`/admin/articles/${id}`)
  revalidatePath('/')
  revalidatePath('/articles')
  return res.data
}

export async function publishArticle(
  id: string,
  payload?: { content?: unknown; title?: string; excerpt?: string | null },
): Promise<Article> {
  const token = await getToken()
  const res = await apiPostAuth<ApiResponse<Article>>(
    `/admin/articles/${id}/publish`,
    token,
    payload ?? {},
  )
  revalidatePath('/admin/articles')
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/articles')
  return res.data
}

export async function deleteArticle(id: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/articles/${id}`, token)
  revalidatePath('/admin/articles')
}

/* ---------- Comments ---------- */

export async function moderateComment(id: string, status: 'approved' | 'rejected'): Promise<Comment> {
  const token = await getToken()
  const res = await apiPatchAuth<ApiResponse<Comment>>(`/admin/comments/${id}`, token, { status })
  revalidatePath('/admin/comments')
  return res.data
}

export async function deleteComment(id: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/comments/${id}`, token)
  revalidatePath('/admin/comments')
}

/* ---------- Categories ---------- */

export async function createCategory(data: { name: string; slug?: string; description?: string }): Promise<Category> {
  const token = await getToken()
  const res = await apiPostAuth<ApiResponse<Category>>('/admin/categories', token, data)
  revalidatePath('/admin/categories')
  return res.data
}

export async function updateCategory(id: string, data: Record<string, unknown>): Promise<Category> {
  const token = await getToken()
  const res = await apiPatchAuth<ApiResponse<Category>>(`/admin/categories/${id}`, token, data)
  revalidatePath('/admin/categories')
  return res.data
}

export async function deleteCategory(id: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/categories/${id}`, token)
  revalidatePath('/admin/categories')
}

/* ---------- Media ---------- */

export async function registerMediaUrl(data: { url: string; alt?: string; caption?: string }): Promise<MediaRecord> {
  const token = await getToken()
  const res = await apiPostAuth<ApiResponse<MediaRecord>>('/admin/media/url', token, data)
  revalidatePath('/admin/media')
  return res.data
}

export async function deleteMedia(id: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/media/${id}`, token)
  revalidatePath('/admin/media')
}

/* ---------- Locks ---------- */

export async function acquireLock(articleId: string): Promise<{ acquired: boolean; data: Record<string, unknown>; message?: string }> {
  const token = await getToken()
  try {
    const res = await apiPostAuth<{ acquired: boolean; data: Record<string, unknown>; message?: string }>(`/admin/articles/${articleId}/lock`, token, {})
    return res
  } catch (e) {
    // 423 = locked by someone else — parse the JSON body
    const err = e as Error & { status?: number }
    if (err.message) return { acquired: false, data: {}, message: err.message }
    throw e
  }
}

export async function renewLock(articleId: string): Promise<void> {
  const token = await getToken()
  await apiPatchAuth(`/admin/articles/${articleId}/lock`, token, {})
}

export async function releaseLock(articleId: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/articles/${articleId}/lock`, token)
}

export async function getLockStatus(articleId: string): Promise<Record<string, unknown> | null> {
  const token = await getToken()
  const res = await apiGetAuth<{ data: Record<string, unknown> | null }>(`/admin/articles/${articleId}/lock`, token)
  return res.data
}

/* ---------- Revisions ---------- */

export async function listRevisions(articleId: string, page = 1): Promise<{ data: Record<string, unknown>[]; total: number }> {
  const token = await getToken()
  return apiGetAuth(`/admin/articles/${articleId}/revisions?page=${page}`, token)
}

export async function restoreRevision(articleId: string, version: number): Promise<Record<string, unknown>> {
  const token = await getToken()
  const res = await apiPostAuth<ApiResponse<Record<string, unknown>>>(`/admin/articles/${articleId}/revisions/${version}/restore`, token, {})
  revalidatePath(`/admin/articles/${articleId}`)
  return res.data
}

/* ---------- Collaborators ---------- */

export async function listCollaborators(articleId: string): Promise<Record<string, unknown>[]> {
  const token = await getToken()
  const res = await apiGetAuth<{ data: Record<string, unknown>[] }>(`/admin/articles/${articleId}/collaborators`, token)
  return res.data
}

export async function addCollaborator(articleId: string, email: string, role = 'contributor'): Promise<Record<string, unknown>> {
  const token = await getToken()
  const res = await apiPostAuth<ApiResponse<Record<string, unknown>>>(`/admin/articles/${articleId}/collaborators`, token, { email, role })
  return res.data
}

export async function removeCollaborator(articleId: string, userId: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/articles/${articleId}/collaborators/${userId}`, token)
}

/* ---------- Editorial Comments ---------- */

export async function listEditorialComments(articleId: string, includeResolved = true): Promise<{ data: Record<string, unknown>[]; unresolved_count: number }> {
  const token = await getToken()
  return apiGetAuth(`/admin/articles/${articleId}/editorial-comments?include_resolved=${includeResolved ? '1' : '0'}`, token)
}

export async function addEditorialComment(articleId: string, body: string): Promise<Record<string, unknown>> {
  const token = await getToken()
  const res = await apiPostAuth<ApiResponse<Record<string, unknown>>>(`/admin/articles/${articleId}/editorial-comments`, token, { body })
  return res.data
}

export async function resolveEditorialComment(articleId: string, commentId: string): Promise<void> {
  const token = await getToken()
  await apiPatchAuth(`/admin/articles/${articleId}/editorial-comments/${commentId}`, token, {})
}

export async function deleteEditorialComment(articleId: string, commentId: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/articles/${articleId}/editorial-comments/${commentId}`, token)
}

/* ---------- Autosave (content only, no revision) ---------- */

export async function autosaveArticle(id: string, content: unknown): Promise<void> {
  const token = await getToken()
  await apiPatchAuth(`/admin/articles/${id}?autosave=1`, token, { content })
}

/* ---------- Profile: metadata + password ---------- */

export async function updateUserMetadata(data: {
  name?: string
  address?: string
  phone?: string
  sex?: string
}): Promise<void> {
  const token = await getToken()
  await apiPatchAuth('/admin/profile/me/metadata', token, data)
  revalidatePath('/admin/profile')
  revalidatePath('/admin')
}

export async function changePassword(password: string): Promise<void> {
  const token = await getToken()
  await apiPostAuth('/admin/profile/me/password', token, { password })
}
