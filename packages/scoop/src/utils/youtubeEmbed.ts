/**
 * YouTube URL → embed URL (no external deps). Aligné avec les embeds reader.
 */

const YOUTUBE_REGEX =
  /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be|youtube-nocookie\.com))(\/(?:[\w-]+\?v=|embed\/|v\/|shorts\/)?)([\w-]+)(\S*)$/

export function isValidYoutubeUrl(url: string): boolean {
  return typeof url === 'string' && YOUTUBE_REGEX.test(url.trim())
}

export function toYoutubeEmbedUrl(url: string): string | null {
  const raw = typeof url === 'string' ? url.trim() : ''
  if (!raw) return null
  const m = YOUTUBE_REGEX.exec(raw)
  if (!m) return null
  const base = 'https://www.youtube.com/embed/'
  if (raw.includes('/embed/')) {
    const id = m[5]
    return id ? `${base}${id}` : raw
  }
  if (raw.includes('youtu.be/')) {
    const id = raw.split('/').pop()?.split('?')[0]
    return id ? `${base}${id}` : null
  }
  const id = m[5]
  return id ? `${base}${id}` : null
}
