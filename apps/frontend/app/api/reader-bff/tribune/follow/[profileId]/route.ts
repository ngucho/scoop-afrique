import { NextRequest, NextResponse } from 'next/server'
import { getReaderAccessToken } from '@/lib/reader-auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await context.params
  const tokenResult = await getReaderAccessToken()
  if (!tokenResult?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const res = await fetch(`${API_URL}/api/v1/tribune/follow/${profileId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
  })
  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  })
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await context.params
  const tokenResult = await getReaderAccessToken()
  if (!tokenResult?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const res = await fetch(`${API_URL}/api/v1/tribune/follow/${profileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
  })
  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  })
}
