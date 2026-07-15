import test from 'node:test'
import assert from 'node:assert/strict'
import type { PublicArticleCard } from './article.service.js'
import { toOfflineManifestItem } from './offline.service.js'

test('toOfflineManifestItem creates a compact versioned content pointer', () => {
  const card: PublicArticleCard = {
    id: 'article-1',
    slug: 'economie-africaine',
    title: 'Economie africaine',
    excerpt: 'Brief',
    cover_image_url: null,
    cover_image_credit: null,
    cover_image_source: null,
    video_url: null,
    cover_video_credit: null,
    category_id: null,
    author_id: 'author-1',
    author_display_name: 'Amina',
    tags: [],
    status: 'published',
    published_at: '2026-07-14T10:00:00.000Z',
    scheduled_at: null,
    meta_title: null,
    meta_description: null,
    og_image_url: null,
    view_count: 1,
    word_count: 500,
    reading_time_min: 3,
    version: 7,
    created_at: '2026-07-14T09:00:00.000Z',
    updated_at: '2026-07-14T11:00:00.000Z',
    author: null,
    author_public: null,
    category: null,
  }

  assert.deepEqual(toOfflineManifestItem(card), {
    id: 'article-1',
    slug: 'economie-africaine',
    title: 'Economie africaine',
    excerpt: 'Brief',
    cover_image_url: null,
    published_at: '2026-07-14T10:00:00.000Z',
    updated_at: '2026-07-14T11:00:00.000Z',
    version: 7,
    reading_time_min: 3,
    content_url: '/api/v1/articles/economie-africaine?track_view=0',
  })
})
