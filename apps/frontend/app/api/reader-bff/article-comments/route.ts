import { NextRequest, NextResponse } from 'next/server'
import { getReaderAccessToken } from '@/lib/reader-auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function POST(request: NextRequest) {
  const tokenResult = await getReaderAccessToken()
  if (!tokenResult?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const json = (await request.json().catch(() => null)) as {
    article_id?: string
    body?: string
    parent_id?: string | null
  } | null
  if (!json?.article_id || typeof json.body !== 'string') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const res = await fetch(`${API_URL}/api/v1/articles/${json.article_id}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenResult.accessToken}`,
    },
    body: JSON.stringify({
      body: json.body,
      parent_id: json.parent_id ?? null,
    }),
  })

  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  })
}
