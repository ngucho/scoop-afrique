/** Backend API response shapes */

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  video_url: string | null
  content: unknown
  category_id: string | null
  author_id: string
  author_display_name: string | null
  tags: string[]
  status: 'draft' | 'review' | 'scheduled' | 'published'
  published_at: string | null
  scheduled_at: string | null
  view_count: number
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  created_at: string
  updated_at: string
  author?: { email: string | null } | null
  category?: { id: string; name: string; slug: string } | null
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface Comment {
  id: string
  article_id: string
  user_id: string | null
  parent_id: string | null
  body: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  author?: { email: string | null } | null
}

export interface MediaRecord {
  id: string
  url: string
  storage_path: string | null
  alt: string | null
  caption: string | null
  uploaded_by: string
  created_at: string
}

// API response wrappers
export interface ApiResponse<T> {
  data: T
}

export interface ApiListResponse<T> {
  data: T[]
  total: number
}

// Legacy aliases
export type ArticlesResponse = ApiListResponse<Article>
export type ArticleResponse = ApiResponse<Article>
export type LikesResponse = ApiResponse<{ count: number; liked: boolean }>
export type NewsletterResponse = ApiResponse<{ success: boolean; message?: string }>
