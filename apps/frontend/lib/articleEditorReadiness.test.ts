import test from 'node:test'
import assert from 'node:assert/strict'
import { buildArticleEditorChecklist, countArticleContentWords } from './articleEditorReadiness'

test('countArticleContentWords extracts words from TipTap documents', () => {
  const doc = {
    type: 'doc',
    content: [
      { type: 'heading', content: [{ type: 'text', text: 'Grand titre' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Une phrase claire pour tester.' }] },
    ],
  }

  assert.equal(countArticleContentWords(doc), 7)
})

test('buildArticleEditorChecklist marks a complete article as ready', () => {
  const checklist = buildArticleEditorChecklist({
    title: 'Titre solide',
    excerpt: 'Resume court et clair',
    categoryId: 'cat-1',
    contentWordCount: 260,
    hasCoverVisual: true,
    hasInvalidVideoUrl: false,
    metaTitle: '',
    metaDescription: '',
  })

  assert.equal(checklist.readyCount, checklist.items.length)
  assert.equal(checklist.items.every((item) => item.done), true)
})

test('buildArticleEditorChecklist surfaces missing editorial basics', () => {
  const checklist = buildArticleEditorChecklist({
    title: 'Trop court',
    excerpt: '',
    categoryId: '',
    contentWordCount: 42,
    hasCoverVisual: false,
    hasInvalidVideoUrl: true,
    metaTitle: '',
    metaDescription: '',
  })

  assert.deepEqual(
    checklist.items.filter((item) => !item.done).map((item) => item.id),
    ['excerpt', 'category', 'body', 'cover', 'video'],
  )
  assert.equal(checklist.readyCount, 1)
})
