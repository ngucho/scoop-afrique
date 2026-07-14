import test from 'node:test'
import assert from 'node:assert/strict'
import { isNotModified, weakEtag } from './http-cache.js'

test('weakEtag returns a stable weak validator for the same version parts', () => {
  const first = weakEtag(['article-1', 3, '2026-07-14T10:00:00.000Z'])
  const second = weakEtag(['article-1', 3, '2026-07-14T10:00:00.000Z'])

  assert.equal(first, second)
  assert.match(first, /^W\/".+"$/)
})

test('isNotModified matches one ETag among multiple If-None-Match validators', () => {
  const etag = weakEtag(['manifest', '2026-07-14T10:00:00.000Z'])
  const headers = {
    get(name: string) {
      return name === 'if-none-match' ? `"other", ${etag}` : undefined
    },
  }

  assert.equal(isNotModified(headers, { etag }), true)
})

test('isNotModified falls back to Last-Modified when If-None-Match is absent', () => {
  const headers = {
    get(name: string) {
      return name === 'if-modified-since' ? 'Tue, 14 Jul 2026 10:00:00 GMT' : undefined
    },
  }

  assert.equal(
    isNotModified(headers, {
      etag: weakEtag(['article-1']),
      lastModified: 'Tue, 14 Jul 2026 09:59:59 GMT',
    }),
    true,
  )
})
