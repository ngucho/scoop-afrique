/**
 * Request and auth logging for maintenance and quick intervention.
 * Uses api-logger for structured output (JSON in prod, readable in dev).
 */
import { apiLog, logApiError } from '@scoop-afrique/api-logger'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  /**
   * Auth failure: no token, invalid token, or config missing.
   * Optional `extras` (e.g. token_summary, reason) are merged for structured logs / dev console.
   */
  authFail(path: string, code: string, detail?: string, extras?: Record<string, unknown>): void {
    // `error` is rendered by all api-logger versions as "— …" in dev; `code`/`token_summary` only in newer formatters.
    const errParts: string[] = [code]
    if (detail) errParts.push(detail)
    if (extras?.reason != null) errParts.push(`reason=${String(extras.reason)}`)
    if (extras?.decode_ok != null) errParts.push(`decode_ok=${String(extras.decode_ok)}`)
    if (extras?.token_summary != null) {
      try {
        errParts.push(`token_summary=${JSON.stringify(extras.token_summary)}`)
      } catch {
        errParts.push('token_summary=<unserializable>')
      }
    }
    const errorLine = errParts.join(' | ')
    const error = errorLine.length > 8000 ? `${errorLine.slice(0, 8000)}…` : errorLine

    apiLog({
      ts: new Date().toISOString(),
      level: 'warn',
      msg: 'auth_fail',
      path,
      code,
      error,
      ...(detail != null && detail !== '' ? { detail } : {}),
      ...extras,
    })
  },

  /** Auth success (optional, for debugging); only in dev */
  authOk(path: string, email: string, role: string): void {
    if (isDev) {
      apiLog({
        ts: new Date().toISOString(),
        level: 'info',
        msg: 'auth_ok',
        path,
        email,
        role,
      })
    }
  },

  /** JWT verification failed; only in dev to avoid leaking details */
  jwtInvalid(reason: string): void {
    if (isDev) {
      apiLog({
        ts: new Date().toISOString(),
        level: 'warn',
        msg: 'jwt_invalid',
        error: reason,
      })
    }
  },

  /** Unhandled error — always includes stack in prod for debugging */
  error(message: string, err?: unknown): void {
    logApiError({
      msg: message,
      err,
    })
  },
}
