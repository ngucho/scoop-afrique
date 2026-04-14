/**
 * API client for backend. Call from Server Components or server actions.
 * Base path includes /api/v1.
 *
 * CACHING: Uses Next.js fetch cache with revalidate intervals.
 * - Article lists: 30s (fresh content)
 * - Single articles: 60s (individual page)
 * - Categories: 10min (rarely change)
 *
 * React `cache()` deduplicates identical GETs during one server render (e.g. layout + page both loading categories).
 */
import { cache } from 'react'
import { config } from '@/lib/config'

const API_PREFIX = '/api/v1'

export function getApiBaseUrl(): string {
  return config.apiBaseUrl
}

export function getApiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const prefix = API_PREFIX.replace(/^\//, '')
  return `${base}/${prefix}${path.startsWith('/') ? path : `/${path}`}`
}

async function apiGetFetch<T>(url: string, options?: RequestInit & { revalidate?: number }): Promise<T> {
  const { revalidate, ...fetchOptions } = options ?? {}
  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions?.headers,
    },
    next: revalidate !== undefined ? { revalidate } : undefined,
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

const apiGetCached = cache((url: string, revalidate: number | undefined) => apiGetFetch<unknown>(url, { revalidate }))

export async function apiGet<T>(path: string, options?: RequestInit & { revalidate?: number }): Promise<T> {
  const url = path.startsWith('http') ? path : getApiUrl(path)
  const opt = options ?? {}
  const keys = Object.keys(opt) as (keyof typeof opt)[]
  const onlyRevalidate =
    keys.length === 0 || (keys.length === 1 && keys[0] === 'revalidate')

  if (onlyRevalidate) {
    return apiGetCached(url, opt.revalidate) as Promise<T>
  }
  return apiGetFetch<T>(url, options)
}

export async function apiPost<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : getApiUrl(path)
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string })?.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}
