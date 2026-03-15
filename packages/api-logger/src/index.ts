/**
 * Standardized API logging for maintenance and debugging.
 * - JSON in production (parseable by log aggregators)
 * - Human-readable in development
 * - Request IDs for tracing across services
 */

const isProd = process.env.NODE_ENV === 'production'

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface ApiLogEntry {
  ts: string
  level: LogLevel
  msg: string
  requestId?: string
  method?: string
  path?: string
  status?: number
  durationMs?: number
  url?: string
  error?: string
  stack?: string
  body?: unknown
  [key: string]: unknown
}

function formatEntry(entry: ApiLogEntry): string {
  if (isProd) {
    return JSON.stringify(entry)
  }
  const parts = [`[${entry.ts}]`, entry.level.toUpperCase(), entry.msg]
  if (entry.requestId) parts.push(`(${entry.requestId})`)
  if (entry.method) parts.push(entry.method)
  if (entry.path) parts.push(entry.path)
  if (entry.status != null) parts.push(String(entry.status))
  if (entry.durationMs != null) parts.push(`${entry.durationMs}ms`)
  if (entry.error) parts.push(`— ${entry.error}`)
  if (entry.stack) parts.push(`\n${entry.stack}`)
  return parts.filter(Boolean).join(' ')
}

export function apiLog(entry: ApiLogEntry): void {
  const formatted = formatEntry(entry)
  if (entry.level === 'error') {
    process.stderr.write(formatted + '\n')
  } else {
    process.stdout.write(formatted + '\n')
  }
}

/** Log incoming API request (call at start) */
export function logApiRequest(opts: {
  requestId: string
  method: string
  path: string
  url?: string
  bodySummary?: unknown
}): void {
  apiLog({
    ts: new Date().toISOString(),
    level: 'info',
    msg: 'api_request_start',
    requestId: opts.requestId,
    method: opts.method,
    path: opts.path,
    url: opts.url,
    bodySummary: opts.bodySummary,
  })
}

/** Log API response (call after response) */
export function logApiResponse(opts: {
  requestId: string
  method: string
  path: string
  status: number
  durationMs: number
  url?: string
}): void {
  const level = opts.status >= 500 ? 'error' : opts.status >= 400 ? 'warn' : 'info'
  apiLog({
    ts: new Date().toISOString(),
    level,
    msg: 'api_response',
    requestId: opts.requestId,
    method: opts.method,
    path: opts.path,
    status: opts.status,
    durationMs: opts.durationMs,
    url: opts.url,
  })
}

/** Log API error with full context (always include stack in prod for debugging) */
export function logApiError(opts: {
  requestId?: string
  method?: string
  path?: string
  msg: string
  err?: unknown
  status?: number
  durationMs?: number
  url?: string
  backendBody?: unknown
}): void {
  const err = opts.err
  const errorStr = err instanceof Error ? err.message : err != null ? String(err) : undefined
  const stack = err instanceof Error ? err.stack : undefined
  apiLog({
    ts: new Date().toISOString(),
    level: 'error',
    msg: opts.msg,
    requestId: opts.requestId,
    method: opts.method,
    path: opts.path,
    status: opts.status,
    durationMs: opts.durationMs,
    url: opts.url,
    error: errorStr,
    stack: stack ?? undefined,
    backendBody: opts.backendBody,
  })
}
