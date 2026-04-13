import { NextRequest, NextResponse } from 'next/server'
import { getReaderAccessToken, getReaderSession, refreshReaderAccessToken } from '@/lib/reader-auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const SESSION_REFRESH_NEEDED = 'SESSION_REFRESH_NEEDED'

function proxyResponseHeaders(backendRes: Response): Headers {
  const headers = new Headers(backendRes.headers)
  headers.delete('content-encoding')
  headers.delete('transfer-encoding')
  return headers
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const tokenResult = await getReaderAccessToken()
  if (!tokenResult?.accessToken) {
    const session = await getReaderSession().catch(() => null)
    const hasSession = !!session?.user
    const code = hasSession ? 'READER_ACCESS_TOKEN_UNAVAILABLE' : 'NO_READER_SESSION'
    if (process.env.NODE_ENV === 'development') {
      console.warn('[api/reader proxy] 401', code, { hasSession })
    }
    return NextResponse.json({ error: 'Unauthorized', code }, { status: 401 })
  }

  const url = new URL(`/api/v1/reader/${pathSegments.join('/')}`, API_URL)
  url.search = request.nextUrl.search

  const bodyText =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text()

  const buildHeaders = (accessToken: string) => {
    const headers = new Headers(request.headers)
    headers.set('Authorization', `Bearer ${accessToken}`)
    headers.delete('host')
    return headers
  }

  const runFetch = (accessToken: string) =>
    fetch(url.toString(), {
      method: request.method,
      headers: buildHeaders(accessToken),
      body: bodyText,
    })

  let res = await runFetch(tokenResult.accessToken)
  if (res.status === 401) {
    try {
      const err = (await res.clone().json()) as { code?: string }
      if (err.code === SESSION_REFRESH_NEEDED) {
        await refreshReaderAccessToken()
        const again = await getReaderAccessToken()
        if (again?.accessToken) {
          res = await runFetch(again.accessToken)
        }
      }
    } catch {
      /* ignore */
    }
  }

  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    statusText: res.statusText,
    headers: proxyResponseHeaders(res),
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  return proxyRequest(request, path)
}
