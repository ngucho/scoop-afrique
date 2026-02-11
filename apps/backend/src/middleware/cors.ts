import type { Context, Next } from 'hono'
import { config } from '../config/env.js'

/**
 * CORS middleware: allow only configured origins and methods.
 */
export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('Origin')
  const allowOrigin =
    origin && config.corsOrigins.includes(origin)
      ? origin
      : config.corsOrigins[0] ?? '*'

  c.header('Access-Control-Allow-Origin', allowOrigin)
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.header('Access-Control-Max-Age', '86400')

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
}
