import { NextRequest, NextResponse } from 'next/server'
import { getReaderAccessToken } from '@/lib/reader-auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const res = await fetch(`${API_URL}/api/v1/contributions/${id}/reactions`, {
    cache: 'no-store',
  })
  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const tokenResult = await getReaderAccessToken()
  if (!tokenResult?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bodyText = await request.text()
  const res = await fetch(`${API_URL}/api/v1/contributions/${id}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenResult.accessToken}`,
    },
    body: bodyText,
  })

  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  })
}
