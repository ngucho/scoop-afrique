import type { Context, Next } from 'hono'

/**
 * Security headers for all responses.
 */
export async function securityHeaders(c: Context, next: Next) {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('X-DNS-Prefetch-Control', 'off')
  await next()
}
