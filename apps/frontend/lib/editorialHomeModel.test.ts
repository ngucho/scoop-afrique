import test from 'node:test'
import assert from 'node:assert/strict'
import type { Article } from '@/lib/api/types'
import type { HomePageBlock } from '@/lib/homeSections'
import { articlesFromHomeBlocks, buildEditorialHomeModel } from './editorialHomeModel'

function article(id: string, patch: Partial<Article> = {}): Article {
  return {
    id,
    slug: id,
    title: `Article ${id}`,
    excerpt: null,
    cover_image_url: null,
    cover_image_credit: null,
    cover_image_source: null,
    video_url: null,
    cover_video_credit: null,
    content: null,
    category_id: null,
    author_id: 'author',
    author_display_name: null,
    tags: [],
    status: 'published',
    published_at: '2026-07-14T10:00:00.000Z',
    scheduled_at: null,
    view_count: 0,
    meta_title: null,
    meta_description: null,
    og_image_url: null,
    created_at: '2026-07-14T09:00:00.000Z',
    updated_at: '2026-07-14T10:00:00.000Z',
    ...patch,
  }
}

test('articlesFromHomeBlocks flattens CMS blocks while removing duplicates', () => {
  const a1 = article('a1')
  const a2 = article('a2')
  const blocks: HomePageBlock[] = [
    { type: 'hero', cmsKey: 'top_stories', title: 'Hero', article: a1 },
    { type: 'articles', cmsKey: 'latest', sectionKey: 'latest', title: 'Latest', layout: 'list', articles: [a1, a2] },
  ]

  assert.deepEqual(articlesFromHomeBlocks(blocks, []).map((a) => a.id), ['a1', 'a2'])
})

test('buildEditorialHomeModel reserves the hero and distributes remaining articles', () => {
  const blocks: HomePageBlock[] = [
    { type: 'hero', cmsKey: 'top_stories', title: 'Hero', article: article('hero') },
    {
      type: 'articles',
      cmsKey: 'latest',
      sectionKey: 'latest',
      title: 'Latest',
      layout: 'list',
      articles: [article('hero'), article('a1'), article('a2'), article('a3'), article('a4')],
    },
    {
      type: 'articles',
      cmsKey: 'video',
      sectionKey: 'video',
      title: 'Video',
      layout: 'carousel',
      articles: [article('v1', { video_url: 'https://youtube.com/watch?v=1' })],
    },
  ]

  const model = buildEditorialHomeModel(blocks, [])

  assert.equal(model.hero?.id, 'hero')
  assert.deepEqual(model.lead.map((a) => a.id), ['a1', 'a2', 'a3', 'a4'])
  assert.deepEqual(model.videos.map((a) => a.id), ['v1'])
})
