import test from 'node:test'
import assert from 'node:assert/strict'
import { buildArticleEditorPayload } from './articleEditorPayload'

test('buildArticleEditorPayload normalizes tags and clearable fields', () => {
  const payload = buildArticleEditorPayload({
    isEditing: true,
    authorName: 'Awa',
    title: '  Titre article  ',
    excerpt: '',
    content: { type: 'doc', content: [] },
    categoryId: '',
    coverImageUrl: '',
    coverImageCredit: '',
    coverImageSource: '',
    videoUrl: '',
    coverVideoCredit: '',
    tags: ' economie, cacao, economie,  ',
    metaTitle: '',
    metaDescription: '',
  })

  assert.deepEqual(payload, {
    title: 'Titre article',
    excerpt: null,
    content: { type: 'doc', content: [] },
    category_id: null,
    cover_image_url: null,
    cover_image_credit: null,
    cover_image_source: null,
    video_url: null,
    cover_video_credit: null,
    tags: ['economie', 'cacao'],
    meta_title: null,
    meta_description: null,
  })
})

test('buildArticleEditorPayload adds author display name only for new articles', () => {
  const payload = buildArticleEditorPayload({
    isEditing: false,
    authorName: 'Jordan',
    title: 'Titre',
    excerpt: 'Intro',
    content: 'body',
    categoryId: 'category-id',
    coverImageUrl: 'https://example.com/a.jpg',
    coverImageCredit: 'Credit',
    coverImageSource: 'Source',
    videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    coverVideoCredit: 'Video credit',
    tags: 'sport, afrique',
    metaTitle: 'SEO title',
    metaDescription: 'SEO description',
  })

  assert.equal(payload.author_display_name, 'Jordan')
  assert.equal(payload.category_id, 'category-id')
  assert.deepEqual(payload.tags, ['sport', 'afrique'])
})
