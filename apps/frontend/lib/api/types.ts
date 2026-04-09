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

/* Reader platform / backoffice */

export interface ReaderAnnouncement {
  id: string
  title: string
  body: string
  audience: 'all' | 'subscribers' | 'guests'
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AdSlot {
  id: string
  key: string
  label: string
  description: string | null
  created_at: string
}

export interface AdCreative {
  id: string
  campaign_id: string
  headline: string
  body: string | null
  image_url: string | null
  link_url: string
  alt?: string | null
  weight?: number
  is_active?: boolean
  sort_order: number
  created_at: string
  updated_at?: string
}

export interface AdCampaign {
  id: string
  slot_id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'ended'
  start_at: string | null
  end_at: string | null
  weight: number
  created_by: string | null
  created_at: string
  updated_at: string
  creatives: AdCreative[]
}

export interface HomepageSection {
  id: string
  key: string
  title: string
  layout: 'featured_grid' | 'list' | 'carousel'
  sort_order: number
  config: Record<string, unknown>
  is_visible: boolean
  updated_at: string
}

export interface NewsletterSubscriberRow {
  id: string
  email: string
  status: 'pending' | 'confirmed' | 'unsubscribed'
  segment_tags: string[]
  signup_source: string | null
  confirmed_at: string | null
  subscribed_at: string
}

export interface NewsletterCampaignRow {
  id: string
  name: string
  cadence: 'daily' | 'weekly' | 'monthly'
  segment_filter: Record<string, unknown>
  subject_template: string
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled'
  send_at: string | null
  last_sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ReaderDashboardKpis {
  subscriberGrowth: { week_start: string; new_subscribers: number }[]
  adCtrBySlot: { slot_key: string; impressions: number; clicks: number; ctr: number | null }[]
  topCategories: {
    category_id: string | null
    name: string
    slug: string | null
    article_count: number
    total_views: number
  }[]
  topArticles: {
    id: string
    title: string
    slug: string
    view_count: number
    category_slug: string | null
  }[]
  newsletterTotals: { confirmed: number; pending: number; unsubscribed: number }
}

/* Reader public announcement + ad placements */

export interface Announcement {
  id: string
  title: string
  body: string
  placement: 'banner' | 'modal' | 'inline' | 'footer'
  priority: number
  link_url: string | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

export type AnnouncementsResponse = ApiResponse<Announcement[]>

export interface AdPlacementsResponse {
  data: {
    slots: AdSlot[]
    creatives_by_slot: Record<string, AdCreative[]>
  }
}
