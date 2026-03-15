import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth0'
import { hasReadCrm } from '@/lib/rbac'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const tokenResult = await getAccessToken()
  if (!tokenResult?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permissions = Array.isArray(tokenResult.permissions) ? tokenResult.permissions : []
  if (!hasReadCrm(permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const path = pathSegments.join('/')
  const url = new URL(`/api/v1/crm/${path}`, API_URL)
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
    headers: res.headers,
  })
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
