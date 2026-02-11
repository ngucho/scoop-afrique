/**
 * Request logging middleware.
 * Logs method, path, status code, and duration for every request.
 */
import type { Context, Next } from 'hono'
import { logger } from '../lib/logger.js'

export async function requestLog(c: Context, next: Next) {
  const start = Date.now()
  const method = c.req.method
  const path = c.req.path

  await next()

  const durationMs = Date.now() - start
  // Response.status exists in Fetch API; assert for TS environments where the type is narrow
  const status = (c.res as { status: number }).status
  logger.request(method, path, status, durationMs)
}
