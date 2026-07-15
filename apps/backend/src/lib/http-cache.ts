import { createHash } from 'node:crypto'
import type { Context } from 'hono'

export function weakEtag(parts: Array<string | number | null | undefined>): string {
  const payload = parts.map((p) => (p == null ? '' : String(p))).join('|')
  const hash = createHash('sha1').update(payload).digest('base64url')
  return `W/"${hash}"`
}

export function isNotModified(
  requestHeaders: { get(name: string): string | undefined | null },
  metadata: { etag: string; lastModified?: string | null },
): boolean {
  const ifNoneMatch = requestHeaders.get('if-none-match')
  if (ifNoneMatch) {
    return ifNoneMatch
      .split(',')
      .map((v) => v.trim())
      .includes(metadata.etag)
  }

  const lastModified = metadata.lastModified
  const ifModifiedSince = requestHeaders.get('if-modified-since')
  if (!lastModified || !ifModifiedSince) return false

  const since = Date.parse(ifModifiedSince)
  const modified = Date.parse(lastModified)
  return Number.isFinite(since) && Number.isFinite(modified) && modified <= since
}

export function setConditionalCacheHeaders(
  c: Context,
  metadata: { etag: string; lastModified?: string | null; cacheControl: string },
): void {
  c.header('ETag', metadata.etag)
  if (metadata.lastModified) c.header('Last-Modified', metadata.lastModified)
  c.header('Cache-Control', metadata.cacheControl)
  c.header('Vary', 'Accept-Encoding')
}
