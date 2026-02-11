/**
 * Proxy: GET /api/admin/notifications — forwards to backend with server-side token.
 * Used by the admin notification bell (client calls this to avoid exposing the token).
 */
import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth0'
import { getApiUrl } from '@/lib/api/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const tokenResult = await getAccessToken()
  if (!tokenResult?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = getApiUrl('/admin/notifications')
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${tokenResult.accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: (err as { error?: string })?.error ?? res.statusText },
      { status: res.status }
    )
  }
  const data = await res.json()
  return NextResponse.json(data)
}
