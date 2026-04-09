import { NextRequest, NextResponse } from 'next/server'
import { getReaderAccessToken } from '@/lib/reader-auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function proxyResponseHeaders(backendRes: Response): Headers {
  const headers = new Headers(backendRes.headers)
  headers.delete('content-encoding')
  headers.delete('transfer-encoding')
  return headers
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const tokenResult = await getReaderAccessToken()
  if (!tokenResult?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(`/api/v1/reader/${pathSegments.join('/')}`, API_URL)
  url.search = request.nextUrl.search

  const headers = new Headers(request.headers)
  headers.set('Authorization', `Bearer ${tokenResult.accessToken}`)
  headers.delete('host')

  const init: RequestInit = {
    method: request.method,
    headers,
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text()
  }

  const res = await fetch(url.toString(), init)
  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    statusText: res.statusText,
    headers: proxyResponseHeaders(res),
  })
}

export async function GET(
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
