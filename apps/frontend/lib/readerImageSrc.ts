import { config } from '@/lib/config'

/** Turn API/stored image URLs into an absolute URL suitable for `next/image`. */
export function absoluteReaderImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const u = url.trim()
  if (!u) return null
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  const base = config.siteUrl.replace(/\/$/, '')
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`
}
