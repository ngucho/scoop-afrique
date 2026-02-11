/**
 * Simple request and auth logging for maintenance and quick intervention.
 * All logs go to stdout with a consistent format.
 */
const isDev = process.env.NODE_ENV !== 'production'

function timestamp(): string {
  return new Date().toISOString()
}

export const logger = {
  /** Incoming request (method + path); status and duration filled after response */
  request(method: string, path: string, status: number, durationMs: number): void {
    const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO'
    console.log(`[${timestamp()}] ${level} ${method} ${path} ${status} ${durationMs}ms`)
  },

  /** Auth failure: no token, invalid token, or config missing */
  authFail(path: string, code: string, detail?: string): void {
    console.warn(
      `[${timestamp()}] AUTH ${code} ${path}${detail ? ` — ${detail}` : ''}`
    )
  },

  /** Auth success (optional, for debugging); only in dev */
  authOk(path: string, email: string, role: string): void {
    if (isDev) {
      console.log(`[${timestamp()}] AUTH OK ${path} ${email} ${role}`)
    }
  },

  /** JWT verification failed; only in dev to avoid leaking details */
  jwtInvalid(reason: string): void {
    if (isDev) {
      console.warn(`[${timestamp()}] JWT invalid: ${reason}`)
    }
  },

  /** Unhandled error */
  error(message: string, err?: unknown): void {
    const detail = err instanceof Error ? err.message : String(err)
    console.error(`[${timestamp()}] ERROR ${message}${detail ? ` — ${detail}` : ''}`)
  },
}
