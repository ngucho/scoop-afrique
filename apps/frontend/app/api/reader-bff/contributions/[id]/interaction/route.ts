import { NextRequest, NextResponse } from 'next/server'
import { getReaderAccessToken } from '@/lib/reader-auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const tokenResult = await getReaderAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (tokenResult?.accessToken) {
    ;(headers as Record<string, string>).Authorization = `Bearer ${tokenResult.accessToken}`
  }
  const res = await fetch(`${API_URL}/api/v1/contributions/${id}/interaction`, {
    cache: 'no-store',
    headers,
  })
  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  })
}
