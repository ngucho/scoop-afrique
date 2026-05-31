import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth0'
import { hasReadCrm } from '@/lib/rbac'
import {
  generateRequestId,
  logApiRequest,
  logApiError,
  logApiResponse,
} from '@scoop-afrique/api-logger'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/**
 * Headers for the server-to-backend fetch only. Do not forward the browser Cookie / full
 * request.headers: Auth0 session cookies + Bearer token can exceed Node's default header
 * limit and produce HTTP 431 (Request Header Fields Too Large).
 */
function buildBackendRequestHeaders(
  request: NextRequest,
  accessToken: string,
  requestId: string,
): Headers {
  const h = new Headers()
  h.set('Authorization', `Bearer ${accessToken}`)
  h.set('x-request-id', requestId)
  const accept = request.headers.get('accept')
  if (accept) h.set('Accept', accept)
  const contentType = request.headers.get('content-type')
  if (contentType && request.method !== 'GET' && request.method !== 'HEAD') {
    h.set('Content-Type', contentType)
  }
  return h
}

/** Response headers from backend, with encoding stripped so client gets plain body (avoids ERR_CONTENT_DECODING_FAILED) */
function proxyResponseHeaders(backendRes: Response): Headers {
  const headers = new Headers(backendRes.headers)
  headers.delete('content-encoding')
  headers.delete('transfer-encoding')
  return headers
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') || generateRequestId()
  const start = Date.now()
  const method = request.method
  const path = `/api/crm/${pathSegments.join('/')}`
  const backendUrl = `${API_URL}/api/v1/crm/${pathSegments.join('/')}`

  const tokenResult = await getAccessToken()
  if (!tokenResult?.accessToken) {
    logApiError({
      requestId,
      method,
      path,
      msg: 'crm_proxy_unauthorized',
      url: backendUrl,
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permissions = Array.isArray(tokenResult.permissions) ? tokenResult.permissions : []
  if (!hasReadCrm(permissions)) {
    logApiError({
      requestId,
      method,
      path,
      msg: 'crm_proxy_forbidden',
      url: backendUrl,
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(`/api/v1/crm/${pathSegments.join('/')}`, API_URL)
  url.search = request.nextUrl.search

  const headers = buildBackendRequestHeaders(request, tokenResult.accessToken, requestId)

  const init: RequestInit = {
    method: request.method,
    headers,
  }
  let bodySummary: unknown = undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const bodyText = await request.text()
    init.body = bodyText
    try {
      const parsed = JSON.parse(bodyText)
      bodySummary =
        typeof parsed === 'object' && parsed !== null
          ? { keys: Object.keys(parsed) }
          : undefined
    } catch {
      bodySummary = { rawLength: bodyText.length }
    }
  }

  logApiRequest({
    requestId,
    method,
    path,
    url: url.toString(),
    bodySummary,
  })

  try {
    const res = await fetch(url.toString(), init)
    const durationMs = Date.now() - start

    if (!res.ok) {
      const contentType = res.headers.get('content-type') ?? ''
      const isJson = contentType.includes('application/json')
      const bodyText = await res.text().catch(() => '')
      let backendBody: unknown = undefined
      if (isJson && bodyText) {
        try {
          backendBody = JSON.parse(bodyText)
        } catch {
          backendBody = { raw: bodyText.slice(0, 500) }
        }
      }
      logApiError({
        requestId,
        method,
        path,
        msg: 'crm_proxy_backend_error',
        status: res.status,
        durationMs,
        url: url.toString(),
        backendBody,
      })
      return new NextResponse(bodyText, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      })
    }

    logApiResponse({
      requestId,
      method,
      path,
      status: res.status,
      durationMs,
      url: url.toString(),
    })

    const contentType = res.headers.get('content-type') ?? ''
    const isBinary =
      contentType.includes('application/pdf') ||
      contentType.includes('application/octet-stream')

    const body = isBinary ? await res.arrayBuffer() : await res.text()
    return new NextResponse(body, {
      status: res.status,
      statusText: res.statusText,
      headers: proxyResponseHeaders(res),
    })
  } catch (err) {
    const durationMs = Date.now() - start
    logApiError({
      requestId,
      method,
      path,
      msg: 'crm_proxy_network_error',
      err,
      durationMs,
      url: url.toString(),
    })
    return NextResponse.json(
      { error: 'Erreur de connexion au serveur', code: 'NETWORK_ERROR' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}
