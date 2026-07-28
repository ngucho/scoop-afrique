import test from 'node:test'
import assert from 'node:assert/strict'
import { createArticlesApp } from './articles.js'

test('protected history route maps an Auth0 provider outage to 503', async () => {
  const app = createArticlesApp({
    isDatabaseConfigured: () => true,
    getAuthUser: async () => ({
      ok: false,
      reason: 'AUTH_PROVIDER_UNAVAILABLE',
    }),
  })

  const response = await app.request('/history', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ article_id: 'article-1' }),
  })
  const body = await response.json() as { code?: string }

  assert.equal(response.status, 503)
  assert.equal(body.code, 'AUTH_PROVIDER_UNAVAILABLE')
})

test('optional recommendation route stays anonymous after authentication failure', async () => {
  const app = createArticlesApp({
    isDatabaseConfigured: () => true,
    listReaderArticleHistoryIds: async () => {
      throw new Error('anonymous request must not resolve profile history')
    },
    getRecommendedArticleForReader: async () => null,
  })

  const response = await app.request('/recommendations/article-1')

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { data: null })
})
