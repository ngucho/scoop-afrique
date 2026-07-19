export const READER_HISTORY_STORAGE_KEY = 'scoop_reader_history'
export const READER_HISTORY_COOKIE_KEY = 'scoop_reader_history'
export const READER_STATE_EVENT = 'scoop-reader-state'

const MAX_HISTORY = 80
const MAX_COOKIE_IDS = 40
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const ACCOUNT_SYNC_STORAGE_KEY = 'scoop_reader_history_account_sync'

export interface ReaderHistoryArticle {
  id: string
  slug: string
  title: string
  category_id: string | null
  category_slug: string | null
  author_id: string
  tags: string[]
}

export interface ReaderHistoryItem extends ReaderHistoryArticle {
  viewed_at: string
  views: number
}

function safeParseHistory(raw: string | null): ReaderHistoryItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Partial<ReaderHistoryItem>[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is ReaderHistoryItem =>
        typeof item.id === 'string' &&
        typeof item.slug === 'string' &&
        typeof item.title === 'string' &&
        typeof item.author_id === 'string' &&
        typeof item.viewed_at === 'string',
      )
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        category_id: item.category_id ?? null,
        category_slug: item.category_slug ?? null,
        author_id: item.author_id,
        tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 12) : [],
        viewed_at: item.viewed_at,
        views: Math.max(1, Number(item.views) || 1),
      }))
  } catch {
    return []
  }
}

export function readReaderHistory(): ReaderHistoryItem[] {
  if (typeof window === 'undefined') return []
  return safeParseHistory(window.localStorage.getItem(READER_HISTORY_STORAGE_KEY))
}

function writeHistoryCookie(history: ReaderHistoryItem[]) {
  const ids = history
    .map((item) => item.id)
    .filter(Boolean)
    .slice(0, MAX_COOKIE_IDS)
    .join(',')
  document.cookie = `${READER_HISTORY_COOKIE_KEY}=${encodeURIComponent(ids)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`
}

function emitReaderState(history: ReaderHistoryItem[]) {
  window.dispatchEvent(new CustomEvent(READER_STATE_EVENT, { detail: { history } }))
}

export function writeReaderHistory(history: ReaderHistoryItem[]) {
  if (typeof window === 'undefined') return
  const normalized = history.slice(0, MAX_HISTORY)
  window.localStorage.setItem(READER_HISTORY_STORAGE_KEY, JSON.stringify(normalized))
  writeHistoryCookie(normalized)
  emitReaderState(normalized)
}

export function recordReaderArticle(article: ReaderHistoryArticle): ReaderHistoryItem[] {
  const previous = readReaderHistory()
  const existing = previous.find((item) => item.id === article.id)
  const nextItem: ReaderHistoryItem = {
    ...article,
    tags: Array.isArray(article.tags) ? article.tags.slice(0, 12) : [],
    viewed_at: new Date().toISOString(),
    views: (existing?.views ?? 0) + 1,
  }
  const next = [nextItem, ...previous.filter((item) => item.id !== article.id)].slice(0, MAX_HISTORY)
  writeReaderHistory(next)
  syncReaderArticleHistory(article.id)
  return next
}

export function syncReaderArticleHistory(articleId: string): Promise<Response | void> {
  return fetch('/api/reader-bff/article-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ article_id: articleId }),
    keepalive: true,
  }).catch(() => {})
}

export function syncRecentReaderHistoryToAccount(history = readReaderHistory()) {
  if (typeof window === 'undefined' || history.length === 0) return
  const todayKey = new Date().toISOString().slice(0, 10)
  if (window.sessionStorage.getItem(ACCOUNT_SYNC_STORAGE_KEY) === todayKey) return
  const ids = history.map((item) => item.id).filter(Boolean).slice(0, 12)
  Promise.all(ids.map((id) => syncReaderArticleHistory(id))).then((responses) => {
    if (responses.some((response) => response instanceof Response && response.ok && response.status !== 202)) {
      window.sessionStorage.setItem(ACCOUNT_SYNC_STORAGE_KEY, todayKey)
    }
  }).catch(() => {})
}

export function readerHistoryIds(history = readReaderHistory()): string[] {
  return history.map((item) => item.id).filter(Boolean).slice(0, MAX_COOKIE_IDS)
}

export function latestReaderArticle(history = readReaderHistory()): ReaderHistoryItem | null {
  return history[0] ?? null
}
