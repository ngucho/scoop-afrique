/**
 * Request and auth logging for maintenance and quick intervention.
 * Uses api-logger for structured output (JSON in prod, readable in dev).
 */
import { apiLog, logApiError } from '@scoop-afrique/api-logger'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  /** Auth failure: no token, invalid token, or config missing */
  authFail(path: string, code: string, detail?: string): void {
    apiLog({
      ts: new Date().toISOString(),
      level: 'warn',
      msg: 'auth_fail',
      path,
      code,
      detail,
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
