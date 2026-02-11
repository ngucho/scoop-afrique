/**
 * YouTube URL helpers for embeds.
 * Supports watch, youtu.be, and embed URLs (aligned with @tiptap/extension-youtube).
 */

const YOUTUBE_REGEX =
  /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be|youtube-nocookie\.com))(\/(?:[\w-]+\?v=|embed\/|v\/|shorts\/)?)([\w-]+)(\S*)$/

/**
 * Returns true if the string looks like a valid YouTube URL.
 */
export function isValidYoutubeUrl(url: string): boolean {
  return typeof url === 'string' && YOUTUBE_REGEX.test(url.trim())
}

/**
 * Converts any supported YouTube URL to an embed URL for use in an iframe.
 * Returns null if the URL is not valid.
 * Idempotent: if the input is already an embed URL, it is returned as-is (no query/fragment).
 */
export function toYoutubeEmbedUrl(url: string): string | null {
  const raw = typeof url === 'string' ? url.trim() : ''
  if (!raw) return null
  const m = YOUTUBE_REGEX.exec(raw)
  if (!m) return null

  const base = 'https://www.youtube.com/embed/'

  if (raw.includes('/embed/')) {
    // Already embed; return canonical form (base + id, no extra params)
    const id = m[5]
    return id ? `${base}${id}` : raw
  }
  if (raw.includes('youtu.be/')) {
    const id = raw.split('/').pop()?.split('?')[0]
    return id ? `${base}${id}` : null
  }
  // Watch / shorts: video ID is 5th capture group in our regex
  const id = m[5]
  return id ? `${base}${id}` : null
}

/**
 * Returns a stable embed URL for reader iframe. Use for any stored YouTube node attrs.src
 * (accepts full watch/youtu.be/embed URL; always returns embed URL or null).
 */
export function getYoutubeEmbedSrc(attrsSrc: string | null | undefined): string | null {
  if (attrsSrc == null || typeof attrsSrc !== 'string') return null
  const s = attrsSrc.trim()
  if (!s) return null
  return toYoutubeEmbedUrl(s)
}
