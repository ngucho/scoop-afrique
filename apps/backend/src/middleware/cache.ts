/**
 * Cache-Control middleware — sets appropriate headers for low-bandwidth optimization.
 *
 * Strategy:
 * - Public read endpoints: short cache (stale-while-revalidate)
 * - Admin endpoints: no-store (private, always fresh)
 * - Static data (categories): longer cache
 */
import type { Context, Next } from 'hono'

/**
 * Public cache: CDN/browser can cache for `maxAge` seconds,
 * serve stale for `swr` seconds while revalidating.
 */
export function publicCache(maxAge: number, swr?: number) {
  return async (c: Context, next: Next) => {
    await next()
    const swrDirective = swr ? `, stale-while-revalidate=${swr}` : ''
    c.header('Cache-Control', `public, max-age=${maxAge}${swrDirective}`)
    c.header('Vary', 'Accept-Encoding')
  }
}

/** Private: no caching (admin/auth endpoints). */
export function noCache() {
  return async (c: Context, next: Next) => {
    await next()
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
    c.header('Pragma', 'no-cache')
  }
}

/** Compress-hint: tell proxies content is compressible. */
export async function compressionHint(c: Context, next: Next) {
  await next()
  // Encourage gzip/brotli at CDN/proxy level
  c.header('Vary', 'Accept-Encoding')
}
