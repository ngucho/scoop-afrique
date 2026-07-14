import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ARTICLE_EDITOR_STEPS,
  canAccessArticleEditorStep,
  getNextArticleEditorStep,
  getPreviousArticleEditorStep,
} from './articleEditorWizard'

test('article editor wizard moves forward in order', () => {
  assert.equal(getNextArticleEditorStep('write'), 'prepare')
  assert.equal(getNextArticleEditorStep('prepare'), 'review')
  assert.equal(getNextArticleEditorStep('review'), 'review')
})

test('article editor wizard moves backward in order', () => {
  assert.equal(getPreviousArticleEditorStep('review'), 'prepare')
  assert.equal(getPreviousArticleEditorStep('prepare'), 'write')
  assert.equal(getPreviousArticleEditorStep('write'), 'write')
})

test('article editor wizard gates prepare and review with core readiness', () => {
  assert.deepEqual(ARTICLE_EDITOR_STEPS.map((step) => step.id), ['write', 'prepare', 'review'])
  assert.equal(canAccessArticleEditorStep('prepare', { hasTitle: false, hasBody: true }), false)
  assert.equal(canAccessArticleEditorStep('prepare', { hasTitle: true, hasBody: true }), true)
  assert.equal(canAccessArticleEditorStep('review', { hasTitle: true, hasBody: true, hasPreparation: false }), false)
  assert.equal(canAccessArticleEditorStep('review', { hasTitle: true, hasBody: true, hasPreparation: true }), true)
})
