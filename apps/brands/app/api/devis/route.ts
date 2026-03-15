import { NextRequest, NextResponse } from 'next/server'
import {
  generateRequestId,
  logApiRequest,
  logApiError,
  logApiResponse,
} from '@scoop-afrique/api-logger'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:4000'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || generateRequestId()
  const start = Date.now()

  let body: unknown = null
  try {
    body = await request.json()
  } catch (err) {
    logApiError({
      requestId,
      method: 'POST',
      path: '/api/devis',
      msg: 'devis_json_parse_error',
      err,
    })
    return NextResponse.json(
      { error: 'Données invalides', code: 'INVALID_JSON' },
      { status: 400 }
    )
  }

  const backendUrl = `${API_BASE}/api/v1/devis`
  logApiRequest({
    requestId,
    method: 'POST',
    path: '/api/devis',
    url: backendUrl,
    bodySummary: body && typeof body === 'object' && 'email' in body
      ? { email: (body as { email?: string }).email, hasCompany: 'company' in body }
      : undefined,
  })

  try {
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    const durationMs = Date.now() - start

    if (!res.ok) {
      logApiError({
        requestId,
        method: 'POST',
        path: '/api/devis',
        msg: 'devis_backend_error',
        status: res.status,
        durationMs,
        url: backendUrl,
        backendBody: data,
      })
      return NextResponse.json(
        { error: data.error ?? 'Erreur serveur', code: data.code },
        { status: res.status }
      )
    }

    logApiResponse({
      requestId,
      method: 'POST',
      path: '/api/devis',
      status: res.status,
      durationMs,
      url: backendUrl,
    })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    const durationMs = Date.now() - start
    logApiError({
      requestId,
      method: 'POST',
      path: '/api/devis',
      msg: 'devis_network_error',
      err,
      durationMs,
      url: backendUrl,
    })
    return NextResponse.json(
      { error: 'Erreur de connexion au serveur', code: 'NETWORK_ERROR' },
      { status: 500 }
    )
  }
}
