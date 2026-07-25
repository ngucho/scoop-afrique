const READER_VISITOR_ID_KEY = 'scoop_anonymous_id'
const READER_VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const VALID_VISITOR_ID = /^[a-zA-Z0-9_-]{16,128}$/

function readVisitorCookie(): string | null {
  const prefix = `${READER_VISITOR_ID_KEY}=`
  const raw = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length)
  if (!raw) return null
  try {
    const value = decodeURIComponent(raw)
    return VALID_VISITOR_ID.test(value) ? value : null
  } catch {
    return null
  }
}

function persistVisitorId(visitorId: string) {
  try {
    window.localStorage.setItem(READER_VISITOR_ID_KEY, visitorId)
  } catch {
    // Cookie persistence still keeps the reader stable when storage is unavailable.
  }
  try {
    document.cookie = `${READER_VISITOR_ID_KEY}=${encodeURIComponent(visitorId)}; Max-Age=${READER_VISITOR_COOKIE_MAX_AGE}; Path=/; SameSite=Lax; Secure`
  } catch {
    // Analytics is best-effort in restricted browser contexts.
  }
}

export function getOrCreateReaderVisitorId(): string {
  if (typeof window === 'undefined') return ''

  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(READER_VISITOR_ID_KEY)
  } catch {
    // Fall back to the cookie below.
  }
  const existing = stored && VALID_VISITOR_ID.test(stored) ? stored : readVisitorCookie()
  if (existing) {
    persistVisitorId(existing)
    return existing
  }

  const visitorId =
    window.crypto.randomUUID?.() ??
    `reader-${Date.now()}-${Math.random().toString(36).slice(2)}`
  persistVisitorId(visitorId)
  return visitorId
}
