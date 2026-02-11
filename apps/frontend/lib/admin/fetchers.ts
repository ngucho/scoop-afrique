/**
 * Server-side data fetchers for admin pages.
 * All require Auth0 access token.
 *
 * User identity is resolved from the Auth0 session (see lib/admin/session.ts).
 * These fetchers are for business data only (articles, comments, categories, media).
 */
import { getAccessToken } from '@/lib/auth0'
import { apiGetAuth } from '@/lib/api/adminClient'
import type {
  Article,
  Comment,
  Category,
  MediaRecord,
  ApiResponse,
  ApiListResponse,
} from '@/lib/api/types'

async function getToken(): Promise<string | null> {
  const t = await getAccessToken()
  return t?.accessToken ?? null
}

/* ---------- Articles ---------- */

export async function fetchAdminArticles(params?: {
  status?: string
  q?: string
  page?: number
  limit?: number
}): Promise<{ data: Article[]; total: number }> {
  const token = await getToken()
  if (!token) return { data: [], total: 0 }
  const sp = new URLSearchParams()
  if (params?.status) sp.set('status', params.status)
  if (params?.q) sp.set('q', params.q)
  sp.set('page', String(params?.page ?? 1))
  sp.set('limit', String(params?.limit ?? 50))
  try {
    return await apiGetAuth<ApiListResponse<Article>>(
      `/admin/articles?${sp.toString()}`,
      token,
    )
  } catch {
    return { data: [], total: 0 }
  }
}

export async function fetchAdminArticle(id: string): Promise<Article | null> {
  const token = await getToken()
  if (!token) return null
  try {
    const res = await apiGetAuth<ApiResponse<Article>>(`/admin/articles/${id}`, token)
    return res.data
  } catch {
    return null
  }
}

/* ---------- Comments ---------- */

export async function fetchAdminComments(params?: {
  status?: string
  page?: number
  limit?: number
}): Promise<{ data: Comment[]; total: number }> {
  const token = await getToken()
  if (!token) return { data: [], total: 0 }
  const sp = new URLSearchParams()
  if (params?.status) sp.set('status', params.status)
  sp.set('page', String(params?.page ?? 1))
  sp.set('limit', String(params?.limit ?? 50))
  try {
    return await apiGetAuth<ApiListResponse<Comment>>(
      `/admin/comments?${sp.toString()}`,
      token,
    )
  } catch {
    return { data: [], total: 0 }
  }
}

/* ---------- Categories ---------- */

export async function fetchCategories(): Promise<Category[]> {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await apiGetAuth<ApiListResponse<Category>>('/admin/categories', token)
    return res.data
  } catch {
    return []
  }
}

/* ---------- Media ---------- */

export async function fetchMedia(params?: {
  page?: number
  limit?: number
}): Promise<{ data: MediaRecord[]; total: number }> {
  const token = await getToken()
  if (!token) return { data: [], total: 0 }
  const sp = new URLSearchParams()
  sp.set('page', String(params?.page ?? 1))
  sp.set('limit', String(params?.limit ?? 30))
  try {
    return await apiGetAuth<ApiListResponse<MediaRecord>>(
      `/admin/media?${sp.toString()}`,
      token,
    )
  } catch {
    return { data: [], total: 0 }
  }
}

/* ---------- Stats (computed from articles) ---------- */

export interface DashboardStats {
  totalArticles: number
  published: number
  drafts: number
  inReview: number
  scheduled: number
  totalComments: number
  pendingComments: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const token = await getToken()
  if (!token) {
    return { totalArticles: 0, published: 0, drafts: 0, inReview: 0, scheduled: 0, totalComments: 0, pendingComments: 0 }
  }
  try {
    const [all, published, drafts, inReview, scheduled, comments, pendingComments] = await Promise.all([
      apiGetAuth<ApiListResponse<Article>>('/admin/articles?limit=1', token),
      apiGetAuth<ApiListResponse<Article>>('/admin/articles?status=published&limit=1', token),
      apiGetAuth<ApiListResponse<Article>>('/admin/articles?status=draft&limit=1', token),
      apiGetAuth<ApiListResponse<Article>>('/admin/articles?status=review&limit=1', token),
      apiGetAuth<ApiListResponse<Article>>('/admin/articles?status=scheduled&limit=1', token),
      apiGetAuth<ApiListResponse<Comment>>('/admin/comments?limit=1', token).catch(() => ({ data: [], total: 0 })),
      apiGetAuth<ApiListResponse<Comment>>('/admin/comments?status=pending&limit=1', token).catch(() => ({ data: [], total: 0 })),
    ])
    return {
      totalArticles: all.total,
      published: published.total,
      drafts: drafts.total,
      inReview: inReview.total,
      scheduled: scheduled.total,
      totalComments: comments.total,
      pendingComments: pendingComments.total,
    }
  } catch {
    return { totalArticles: 0, published: 0, drafts: 0, inReview: 0, scheduled: 0, totalComments: 0, pendingComments: 0 }
  }
}

/* ---------- Auth0 users (for team / collaborators) ---------- */

export interface Auth0UserSummary {
  user_id: string
  email: string | null
  name: string | null
  picture: string | null
}

export async function fetchAuth0Users(
  page = 0,
  perPage = 50,
): Promise<{ data: Auth0UserSummary[]; total: number }> {
  const token = await getToken()
  if (!token) return { data: [], total: 0 }
  const sp = new URLSearchParams()
  sp.set('page', String(page))
  sp.set('per_page', String(perPage))
  try {
    const res = await apiGetAuth<{ data: Auth0UserSummary[]; total: number }>(
      `/admin/auth0-users?${sp.toString()}`,
      token,
    )
    return { data: res.data ?? [], total: res.total ?? 0 }
  } catch {
    return { data: [], total: 0 }
  }
}
