import test from 'node:test'
import assert from 'node:assert/strict'
import { extractYoutubeVideoId, getYoutubeThumbnailUrl } from './youtube-thumbnail.js'

test('extractYoutubeVideoId supports watch, short, embed, and youtu.be URLs', () => {
  assert.equal(extractYoutubeVideoId('https://www.youtube.com/watch?v=abc123XYZ_0'), 'abc123XYZ_0')
  assert.equal(extractYoutubeVideoId('https://youtu.be/abc123XYZ_0?t=10'), 'abc123XYZ_0')
  assert.equal(extractYoutubeVideoId('https://www.youtube.com/embed/abc123XYZ_0'), 'abc123XYZ_0')
  assert.equal(extractYoutubeVideoId('https://www.youtube.com/shorts/abc123XYZ_0'), 'abc123XYZ_0')
})

test('getYoutubeThumbnailUrl returns a stable public thumbnail URL', () => {
  assert.equal(
    getYoutubeThumbnailUrl('https://www.youtube.com/watch?v=abc123XYZ_0'),
    'https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg',
  )
})

test('getYoutubeThumbnailUrl returns null for invalid input', () => {
  assert.equal(getYoutubeThumbnailUrl('https://example.com/video'), null)
  assert.equal(getYoutubeThumbnailUrl(''), null)
  assert.equal(getYoutubeThumbnailUrl(undefined), null)
})
