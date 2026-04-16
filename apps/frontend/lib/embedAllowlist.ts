/**
 * Allowed article embeds: same-origin paths only (no arbitrary URLs).
 * Keeps editor + reader aligned with security expectations (XSS, open redirects).
 */

const EMBED_PREFIX = '/embeds/'

/** Preset slugs editors can insert without typing a path (toolbar). */
export const PRESET_EMBED_PATHS = {
  globePerception: `${EMBED_PREFIX}globe-perception`,
} as const

function stripQueryAndHash(path: string): string {
  const q = path.indexOf('?')
  const h = path.indexOf('#')
  let end = path.length
  if (q >= 0) end = Math.min(end, q)
  if (h >= 0) end = Math.min(end, h)
  return path.slice(0, end)
}

/**
 * Returns a normalized path like `/embeds/foo` or null if not allowed.
 * Accepts only relative paths starting with `/embeds/`, no `..`, no scheme.
 */
export function normalizeAllowedEmbedPath(input: string): string | null {
  const raw = (input ?? '').trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw) || /^\/\//.test(raw)) return null
  let path = raw.startsWith('/') ? raw : `/${raw}`
  path = stripQueryAndHash(path)
  if (!path.startsWith(EMBED_PREFIX)) return null
  const segments = path.split('/').filter(Boolean)
  for (const seg of segments) {
    if (seg === '..' || seg === '.') return null
  }
  return path
}

export function isAllowedEmbedPath(path: string): boolean {
  return normalizeAllowedEmbedPath(path) !== null
}
