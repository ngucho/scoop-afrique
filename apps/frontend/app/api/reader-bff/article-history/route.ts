import { NextRequest, NextResponse } from 'next/server'
import { getReaderAccessToken } from '@/lib/reader-auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function POST(request: NextRequest) {
  const tokenResult = await getReaderAccessToken()
  if (!tokenResult?.accessToken) {
    return NextResponse.json({ data: { synced: false } }, { status: 202 })
  }

  const json = (await request.json().catch(() => null)) as { article_id?: string } | null
  if (!json?.article_id) {
    return NextResponse.json({ error: 'article_id required' }, { status: 400 })
  }

  const res = await fetch(`${API_URL}/api/v1/articles/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenResult.accessToken}`,
    },
    body: JSON.stringify({ article_id: json.article_id }),
  })

  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  })
}
