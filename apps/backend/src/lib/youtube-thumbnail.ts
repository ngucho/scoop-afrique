const YOUTUBE_REGEX =
  /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be|youtube-nocookie\.com))(\/(?:[\w-]+\?v=|embed\/|v\/|shorts\/)?)([\w-]+)(\S*)$/

export function extractYoutubeVideoId(url: string | null | undefined): string | null {
  const raw = typeof url === 'string' ? url.trim() : ''
  if (!raw) return null

  const match = YOUTUBE_REGEX.exec(raw)
  if (!match) return null

  if (raw.includes('youtu.be/')) {
    const id = raw.split('/').pop()?.split('?')[0]
    return id || null
  }

  return match[5] || null
}

export function getYoutubeThumbnailUrl(url: string | null | undefined): string | null {
  const id = extractYoutubeVideoId(url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}
