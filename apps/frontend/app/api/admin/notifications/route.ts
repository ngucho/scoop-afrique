/**
 * Proxy: GET /api/admin/notifications — forwards to backend with server-side token.
 * Used by the admin notification bell (client calls this to avoid exposing the token).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth0'
import { getApiUrl } from '@/lib/api/client'
import {
  generateRequestId,
  logApiRequest,
  logApiError,
  logApiResponse,
} from '@scoop-afrique/api-logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || generateRequestId()
  const start = Date.now()
  const path = '/api/admin/notifications'
  const url = getApiUrl('/admin/notifications')

  const tokenResult = await getAccessToken()
  if (!tokenResult?.accessToken) {
    logApiError({
      requestId,
      method: 'GET',
      path,
      msg: 'admin_notifications_unauthorized',
      url,
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logApiRequest({
    requestId,
    method: 'GET',
    path,
    url,
  })

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
    })
    const durationMs = Date.now() - start

    if (!res.ok) {
      const bodyText = await res.text()
      let backendBody: unknown = undefined
      try {
        backendBody = bodyText ? JSON.parse(bodyText) : undefined
      } catch {
        backendBody = { raw: bodyText.slice(0, 500) }
      }
      logApiError({
        requestId,
        method: 'GET',
        path,
        msg: 'admin_notifications_backend_error',
        status: res.status,
        durationMs,
        url,
        backendBody,
      })
      const err = backendBody && typeof backendBody === 'object' && 'error' in backendBody
        ? (backendBody as { error?: string })
        : {}
      return NextResponse.json(
        { error: err.error ?? res.statusText },
        { status: res.status }
      )
    }

    logApiResponse({
      requestId,
      method: 'GET',
      path,
      status: res.status,
      durationMs,
      url,
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    const durationMs = Date.now() - start
    logApiError({
      requestId,
      method: 'GET',
      path,
      msg: 'admin_notifications_network_error',
      err,
      durationMs,
      url,
    })
    return NextResponse.json(
      { error: 'Erreur de connexion au serveur', code: 'NETWORK_ERROR' },
      { status: 500 }
    )
  }
}
