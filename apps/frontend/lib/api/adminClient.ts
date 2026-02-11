/**
 * Authenticated API client for backoffice. Pass access token from getAccessToken().
 *
 * Admin fetches use `cache: 'no-store'` to always get fresh data from the API.
 * The backend itself uses in-memory caching for DB/Auth0 to reduce latency.
 */
import { getApiUrl } from './client'

export async function apiGetAuth<T>(path: string, accessToken: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : getApiUrl(path)
  const res = await fetch(url, {
    cache: 'no-store', // Admin data must be fresh
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message = (err as { error?: string })?.error ?? res.statusText
    const e = new Error(message) as Error & { status?: number }
    e.status = res.status
    throw e
  }
  return res.json() as Promise<T>
}

export async function apiPostAuth<T>(
  path: string,
  accessToken: string,
  body: unknown,
  options?: RequestInit
): Promise<T> {
  const url = path.startsWith('http') ? path : getApiUrl(path)
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
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

export async function apiPatchAuth<T>(
  path: string,
  accessToken: string,
  body: unknown,
  options?: RequestInit
): Promise<T> {
  const url = path.startsWith('http') ? path : getApiUrl(path)
  const res = await fetch(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
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

/** Upload a file via multipart/form-data */
export async function apiUploadAuth<T>(
  path: string,
  accessToken: string,
  formData: FormData
): Promise<T> {
  const url = path.startsWith('http') ? path : getApiUrl(path)
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Do NOT set Content-Type — browser sets it with boundary for multipart
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string })?.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export async function apiDeleteAuth(path: string, accessToken: string): Promise<void> {
  const url = path.startsWith('http') ? path : getApiUrl(path)
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string })?.error ?? res.statusText)
  }
}
