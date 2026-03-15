/**
 * Request logging middleware.
 * Generates/forwards request ID, logs method, path, status, duration for every request.
 * On error, logs full context (including stack) before rethrowing.
 */
import type { Context, Next } from 'hono'
import {
  generateRequestId,
  logApiResponse,
  logApiError,
} from '@scoop-afrique/api-logger'

export async function requestLog(c: Context, next: Next) {
  const requestId =
    c.req.header('x-request-id') || generateRequestId()
  c.header('x-request-id', requestId)

  const method = c.req.method
  const path = c.req.path
  const start = Date.now()

  try {
    await next()
    const durationMs = Date.now() - start
    const status = (c.res as { status: number }).status
    logApiResponse({
      requestId,
      method,
      path,
      status,
      durationMs,
    })
  } catch (err) {
    const durationMs = Date.now() - start
    logApiError({
      requestId,
      method,
      path,
      msg: 'request_error',
      err,
      durationMs,
    })
    throw err
  }
}
