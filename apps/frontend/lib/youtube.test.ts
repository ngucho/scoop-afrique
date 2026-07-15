import test from 'node:test'
import assert from 'node:assert/strict'
import { getYoutubeThumbnailUrl, getYoutubeVideoId } from './youtube'

test('getYoutubeVideoId extracts ids from supported YouTube URLs', () => {
  assert.equal(getYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(getYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=10'), 'dQw4w9WgXcQ')
  assert.equal(getYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(getYoutubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
})

test('getYoutubeVideoId rejects invalid or empty values', () => {
  assert.equal(getYoutubeVideoId(''), null)
  assert.equal(getYoutubeVideoId('https://example.com/watch?v=dQw4w9WgXcQ'), null)
})

test('getYoutubeThumbnailUrl returns a stable high quality thumbnail URL', () => {
  assert.equal(
    getYoutubeThumbnailUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  )
})
