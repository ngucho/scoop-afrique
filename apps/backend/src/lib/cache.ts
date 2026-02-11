/**
 * Simple in-memory cache with TTL — optimized for low-bandwidth environments.
 *
 * Avoids repeated calls to Supabase and Auth0 for data that rarely changes.
 * Uses Map-based storage with automatic expiration.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>()
  private readonly defaultTtlMs: number
  private readonly maxEntries: number

  constructor(options: { ttlMs?: number; maxEntries?: number } = {}) {
    this.defaultTtlMs = options.ttlMs ?? 60_000 // 1 minute default
    this.maxEntries = options.maxEntries ?? 500
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Evict oldest if at capacity
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value
      if (firstKey !== undefined) this.store.delete(firstKey)
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    })
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  /** Invalidate all entries matching a prefix */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key)
    }
  }

  clear(): void {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }
}

/* ---------- Shared cache instances ---------- */

/** Profile cache: keyed by auth0_id, 5-minute TTL (synced on every request anyway) */
export const profileCache = new MemoryCache<unknown>({
  ttlMs: 5 * 60 * 1000,
  maxEntries: 200,
})

/** Category cache: 10-minute TTL (rarely change) */
export const categoryCache = new MemoryCache<unknown>({
  ttlMs: 10 * 60 * 1000,
  maxEntries: 100,
})

/** Article cache: short TTL for list queries, longer for individual articles */
export const articleCache = new MemoryCache<unknown>({
  ttlMs: 30_000, // 30 seconds for lists
  maxEntries: 300,
})

/** Comment count cache: 1-minute TTL */
export const commentCache = new MemoryCache<unknown>({
  ttlMs: 60_000,
  maxEntries: 100,
})
