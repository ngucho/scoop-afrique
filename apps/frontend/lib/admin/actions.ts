'use server'

/**
 * Server actions for admin operations.
 * These use the backend API with the Auth0 access token.
 */
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth0'
import { apiGetAuth, apiPostAuth, apiPatchAuth, apiDeleteAuth } from '@/lib/api/adminClient'
import type {
  Article,
  Comment,
  Category,
  MediaRecord,
  ApiResponse,
  ReaderContribution,
  DigestArticlePickRow,
} from '@/lib/api/types'
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

/* ---------- Reader contributions (tribune) ---------- */

export async function moderateReaderContribution(
  id: string,
  status: 'approved' | 'rejected' | 'suspended' | 'pending',
): Promise<ReaderContribution> {
  const token = await getToken()
  const res = await apiPatchAuth<ApiResponse<ReaderContribution>>(
    `/admin/contributions/${id}`,
    token,
    { status },
  )
  revalidatePath('/admin/contributions')
  revalidatePath('/tribune')
  return res.data
}

export async function deleteReaderContribution(id: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/contributions/${id}`, token)
  revalidatePath('/admin/contributions')
  revalidatePath('/tribune')
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
  public_bio?: string
  public_avatar_url?: string
  contact_private?: string
  preferences?: string
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

/* ---------- Reader platform ---------- */

function revReader() {
  revalidatePath('/admin')
  revalidatePath('/admin/reader/announcements')
  revalidatePath('/admin/reader/ads')
  revalidatePath('/admin/reader/homepage')
  revalidatePath('/admin/reader/subscribers')
  revalidatePath('/admin/reader/newsletters')
  revalidatePath('/admin/reader/chrome')
  revalidatePath('/', 'layout')
  revalidatePath('/articles', 'layout')
}

export async function createAnnouncement(data: Record<string, unknown>): Promise<void> {
  const token = await getToken()
  await apiPostAuth('/admin/reader/announcements', token, data)
  revReader()
}

export async function updateAnnouncement(id: string, data: Record<string, unknown>): Promise<void> {
  const token = await getToken()
  await apiPatchAuth(`/admin/reader/announcements/${id}`, token, data)
  revReader()
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/reader/announcements/${id}`, token)
  revReader()
}

export async function createAdCampaign(data: Record<string, unknown>): Promise<void> {
  const token = await getToken()
  await apiPostAuth('/admin/reader/ads/campaigns', token, data)
  revReader()
}

export async function ingestAudienceMetric(data: Record<string, unknown>): Promise<void> {
  const token = await getToken()
  await apiPostAuth('/admin/reader/audience-metrics', token, data)
  revReader()
  revalidatePath('/admin/reader/audience-metrics')
}

export async function updateAdCampaign(id: string, data: Record<string, unknown>): Promise<void> {
  const token = await getToken()
  await apiPatchAuth(`/admin/reader/ads/campaigns/${id}`, token, data)
  revReader()
}

export async function deleteAdCampaign(id: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/reader/ads/campaigns/${id}`, token)
  revReader()
}

export async function upsertCreative(
  campaignId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const token = await getToken()
  await apiPostAuth(`/admin/reader/ads/campaigns/${campaignId}/creatives`, token, data)
  revReader()
}

export async function deleteCreative(campaignId: string, creativeId: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/reader/ads/campaigns/${campaignId}/creatives/${creativeId}`, token)
  revReader()
}

export async function updateHomepageSection(id: string, data: Record<string, unknown>): Promise<void> {
  const token = await getToken()
  await apiPatchAuth(`/admin/reader/homepage-sections/${id}`, token, data)
  revReader()
  revalidatePath('/admin/reader/homepage')
}

export async function updateSubscriberSegments(
  id: string,
  data: { segment_tags: string[]; reason?: string },
): Promise<void> {
  const token = await getToken()
  await apiPatchAuth(`/admin/reader/subscribers/${id}`, token, data)
  revReader()
}

export async function createNewsletterCampaign(data: Record<string, unknown>): Promise<void> {
  const token = await getToken()
  await apiPostAuth('/admin/reader/newsletter-campaigns', token, data)
  revReader()
}

export async function updateNewsletterCampaign(id: string, data: Record<string, unknown>): Promise<void> {
  const token = await getToken()
  await apiPatchAuth(`/admin/reader/newsletter-campaigns/${id}`, token, data)
  revReader()
  revalidatePath(`/admin/reader/newsletters/${id}`)
}

export async function deleteNewsletterCampaign(id: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/reader/newsletter-campaigns/${id}`, token)
  revReader()
}

export async function previewWeeklyNewsletterDigest(): Promise<DigestArticlePickRow[]> {
  const token = await getToken()
  const res = await apiPostAuth<{ data: { articles: DigestArticlePickRow[] } }>(
    '/admin/reader/newsletter-weekly-digest/preview',
    token,
    {},
  )
  return res.data.articles ?? []
}

export async function sendWeeklyNewsletterDigest(dryRun: boolean): Promise<{
  jobId: string
  articleIds: string[]
  recipientsAttempted: number
  recipientsSent: number
  recipientsFailed: number
  error?: string
}> {
  const token = await getToken()
  const res = await apiPostAuth<{
    data: {
      jobId: string
      articleIds: string[]
      recipientsAttempted: number
      recipientsSent: number
      recipientsFailed: number
      error?: string
    }
  }>('/admin/reader/newsletter-weekly-digest/send', token, { dry_run: dryRun })
  return res.data
}

/* ---------- Message emplacements pub vides + API Writer ---------- */

export async function updateChromeSettings(data: {
  empty_ad_title?: string | null
  empty_ad_subtitle?: string | null
}): Promise<void> {
  const token = await getToken()
  await apiPatchAuth('/admin/reader/chrome-settings', token, data)
  revReader()
}

export async function createWriterApiKey(label?: string): Promise<{
  id: string
  raw_key: string
  key_prefix: string
}> {
  const token = await getToken()
  const res = await apiPostAuth<ApiResponse<{ id: string; raw_key: string; key_prefix: string }>>(
    '/admin/writer-api-keys',
    token,
    { label: label?.trim() || 'Clé' },
  )
  return res.data
}

export async function revokeWriterApiKey(id: string): Promise<void> {
  const token = await getToken()
  await apiDeleteAuth(`/admin/writer-api-keys/${id}`, token)
  revalidatePath('/admin/writer-api')
}
