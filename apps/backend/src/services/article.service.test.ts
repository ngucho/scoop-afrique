import test from 'node:test'
import assert from 'node:assert/strict'
import type { PublicArticleCard } from './article.service.js'
import {
  canCreateArticleWithStatus,
  decodeArticleFeedCursor,
  encodeArticleFeedCursor,
  presentArticleForPublicApi,
  presentArticleCardForPublicApi,
} from './article.service.js'

test('canCreateArticleWithStatus allows published creation only for editor roles', () => {
  assert.equal(canCreateArticleWithStatus('journalist', 'draft'), true)
  assert.equal(canCreateArticleWithStatus('journalist', 'review'), true)
  assert.equal(canCreateArticleWithStatus('journalist', 'published'), false)
  assert.equal(canCreateArticleWithStatus('editor', 'published'), true)
  assert.equal(canCreateArticleWithStatus('manager', 'published'), true)
  assert.equal(canCreateArticleWithStatus('admin', 'published'), true)
})

test('presentArticleCardForPublicApi keeps list payloads free of article content', () => {
  const card: PublicArticleCard = {
    id: 'article-1',
    slug: 'article-1',
    title: 'Article 1',
    excerpt: 'Short summary',
    cover_image_url: 'https://cdn.example/article.jpg',
    cover_image_credit: null,
    cover_image_source: null,
    video_url: null,
    cover_video_credit: null,
    category_id: null,
    author_id: 'author-1',
    author_display_name: null,
    tags: ['news'],
    status: 'published',
    published_at: '2026-07-14T10:00:00.000Z',
    scheduled_at: null,
    meta_title: null,
    meta_description: null,
    og_image_url: null,
    view_count: 10,
    word_count: 600,
    reading_time_min: 3,
    version: 2,
    created_at: '2026-07-14T09:00:00.000Z',
    updated_at: '2026-07-14T10:00:00.000Z',
    author: { email: 'amina.editor@scoop-afrique.com' },
    author_public: null,
    category: null,
    reader_public_display_name: null,
  }

  const presented = presentArticleCardForPublicApi(card)

  assert.equal(Object.hasOwn(presented, 'content'), false)
  assert.equal(Object.hasOwn(presented, 'last_saved_by'), false)
  assert.equal(presented.og_image_url, 'https://cdn.example/article.jpg')
  assert.equal(presented.author_display_name, 'Amina Editor')
})

test('presentArticleCardForPublicApi uses YouTube thumbnail when a video article has no cover image', () => {
  const card: PublicArticleCard = {
    id: 'article-video',
    slug: 'article-video',
    title: 'Video article',
    excerpt: null,
    cover_image_url: null,
    cover_image_credit: null,
    cover_image_source: null,
    video_url: 'https://www.youtube.com/watch?v=abc123XYZ_0',
    cover_video_credit: null,
    category_id: null,
    author_id: 'author-1',
    author_display_name: 'Scoop Afrique',
    tags: [],
    status: 'published',
    published_at: '2026-07-14T10:00:00.000Z',
    scheduled_at: null,
    meta_title: null,
    meta_description: null,
    og_image_url: null,
    view_count: 10,
    word_count: 600,
    reading_time_min: 3,
    version: 2,
    created_at: '2026-07-14T09:00:00.000Z',
    updated_at: '2026-07-14T10:00:00.000Z',
    author: null,
    author_public: null,
    category: null,
    reader_public_display_name: null,
  }

  const presented = presentArticleCardForPublicApi(card)

  assert.equal(presented.cover_image_url, 'https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg')
  assert.equal(presented.og_image_url, 'https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg')
})

test('presentArticleForPublicApi keeps video cover behavior while using YouTube thumbnail for OG image', () => {
  const article = {
    id: 'article-video',
    slug: 'article-video',
    title: 'Video article',
    excerpt: null,
    cover_image_url: null,
    cover_image_credit: null,
    cover_image_source: null,
    video_url: 'https://youtu.be/abc123XYZ_0',
    cover_video_credit: null,
    content: { type: 'doc', content: [] },
    category_id: null,
    author_id: 'author-1',
    author_display_name: 'Scoop Afrique',
    tags: [],
    status: 'published' as const,
    published_at: '2026-07-14T10:00:00.000Z',
    scheduled_at: null,
    meta_title: null,
    meta_description: null,
    og_image_url: null,
    view_count: 10,
    word_count: 600,
    reading_time_min: 3,
    version: 2,
    last_saved_by: null,
    created_at: '2026-07-14T09:00:00.000Z',
    updated_at: '2026-07-14T10:00:00.000Z',
    author: null,
    author_public: null,
    category: null,
    reader_public_display_name: null,
  }

  const presented = presentArticleForPublicApi(article)

  assert.equal(presented.cover_image_url, null)
  assert.equal(presented.og_image_url, 'https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg')
})

test('article feed cursors round-trip and reject malformed values', () => {
  const cursor = {
    id: '11111111-1111-4111-8111-111111111111',
    published_at: '2026-07-14T10:00:00.000Z',
  }

  assert.deepEqual(decodeArticleFeedCursor(encodeArticleFeedCursor(cursor)), cursor)
  assert.equal(decodeArticleFeedCursor('not-json'), null)
  assert.equal(decodeArticleFeedCursor(undefined), null)
})
