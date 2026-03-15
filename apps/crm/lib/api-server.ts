/**
 * CRM API client for Server Components — fetches from backend with server token
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function getToken(): Promise<string | null> {
  const { getAccessToken } = await import('@/lib/auth0')
  const result = await getAccessToken()
  return result?.accessToken ?? null
}

export async function crmFetchServer<T>(
  path: string,
  init?: RequestInit
): Promise<{ data: T; total?: number } | null> {
  const token = await getToken()
  if (!token) return null

  const res = await fetch(`${API_URL}/api/v1/crm/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) return null
  return {
    data: json.data ?? json,
    total: json.total,
  }
}

export async function crmGetServer<T>(path: string): Promise<{ data: T; total?: number } | null> {
  return crmFetchServer<T>(path, { method: 'GET' })
}
