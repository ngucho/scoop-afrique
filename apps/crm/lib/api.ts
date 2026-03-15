/**
 * CRM API client — fetches from /api/crm/* (proxied to backend)
 */
const API_BASE = '/api/crm'

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const { getAccessToken } = await import('@auth0/nextjs-auth0/client')
    const token = await getAccessToken()
    return typeof token === 'string' ? token : (token as { accessToken?: string })?.accessToken ?? null
  } catch {
    return null
  }
}

export async function crmFetch<T>(
  path: string,
  init?: RequestInit
): Promise<{ data: T } | { error: string }> {
  const token = await getToken()
  if (!token) {
    return { error: 'Unauthorized' }
  }

  const res = await fetch(`${API_BASE}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { error: (json as { error?: string }).error ?? 'Request failed' }
  }
  return { data: json.data ?? json }
}

export async function crmGet<T>(path: string): Promise<{ data: T } | { error: string }> {
  return crmFetch<T>(path, { method: 'GET' })
}

export async function crmPost<T>(path: string, body: unknown): Promise<{ data: T } | { error: string }> {
  return crmFetch<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

export async function crmPatch<T>(path: string, body: unknown): Promise<{ data: T } | { error: string }> {
  return crmFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function crmDelete(path: string): Promise<{ error?: string }> {
  const token = await getToken()
  if (!token) return { error: 'Unauthorized' }

  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { error: (json as { error?: string }).error ?? 'Request failed' }
  return {}
}
