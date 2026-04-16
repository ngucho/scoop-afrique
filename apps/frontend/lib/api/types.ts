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
  /** Champs publics (profil journaliste) — pas d’email / contact. */
  author_public?: {
    bio: string | null
    avatar_url: string | null
  } | null
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

export interface ContributionAuthor {
  profile_id: string
  pseudo: string | null
  display_name: string | null
  avatar_url: string | null
  email: string | null
}

export interface ReaderContribution {
  id: string
  user_id: string
  article_id?: string | null
  kind: 'writing' | 'event'
  title: string
  body: string
  event_location: string | null
  event_starts_at: string | null
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  is_anonymous?: boolean
  upvote_count?: number
  downvote_count?: number
  comment_count?: number
  created_at: string
  updated_at: string
  author: ContributionAuthor | null
}

export interface ContributionComment {
  id: string
  contribution_id: string
  parent_id: string | null
  body: string
  is_anonymous: boolean
  created_at: string
  author_email: string | null
  author_pseudo: string | null
  author_display_name: string | null
  author_avatar_url: string | null
  reactions: { emoji: string; count: number }[]
  your_reaction_emojis: string[]
}

export interface TribuneFollowListRow {
  profile_id: string
  pseudo: string | null
  display_name: string | null
  avatar_url: string | null
  followed_at: string
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
  link_url: string | null
  placement: 'banner' | 'modal' | 'inline' | 'footer' | 'sidebar'
  priority: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ReaderChromeSettings {
  empty_ad_title: string | null
  empty_ad_subtitle: string | null
  updated_at: string
}

export interface WriterApiKeyRow {
  id: string
  key_prefix: string
  label: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
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
  cta_label?: string | null
  video_url?: string | null
  format?: 'image' | 'native' | 'video'
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

/** Article row returned by weekly digest preview API (ranking for mailing). */
export interface DigestArticlePickRow {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  view_count: number
  tags: string[]
  category_slug: string | null
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
  body_html: string | null
  preheader: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  send_at: string | null
  last_sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ReaderAdMetrics {
  days: number
  by_slot: { slot_key: string; impressions: number; clicks: number; ctr: number | null }[]
  totals: { impressions: number; clicks: number; ctr: number | null }
}

/** Single KPI snapshot row (admin time-series / dashboards). */
export interface AudienceMetricSnapshot {
  id: string
  platform: string
  metric_key: string
  snapshot_date: string
  country_code: string | null
  value_numeric: string
  source: string
  metadata: Record<string, unknown>
  created_at: string
}

/** Latest value per (platform, metric_key) — shape from GET /audience-metrics/latest. */
export interface AudienceMetricLatestRow {
  platform: string
  metric_key: string
  snapshot_date: string
  value_numeric: string
  country_code: string | null
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
  audienceLatest?: {
    platform: string
    metric_key: string
    snapshot_date: string
    value_numeric: string
    country_code: string
  }[]
}

/* Reader public announcement + ad placements */

export interface Announcement {
  id: string
  title: string
  body: string
  placement: 'banner' | 'modal' | 'inline' | 'footer' | 'sidebar'
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
