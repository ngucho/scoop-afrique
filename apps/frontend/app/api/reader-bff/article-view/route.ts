import { NextRequest, NextResponse } from 'next/server'
import { getReaderAccessToken } from '@/lib/reader-auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function POST(request: NextRequest) {
  const json = (await request.json().catch(() => null)) as {
    article_id?: string
    visitor_id?: string
  } | null
  if (!json?.article_id || !json.visitor_id) {
    return NextResponse.json({ error: 'article_id and visitor_id required' }, { status: 400 })
  }

  const tokenResult = await getReaderAccessToken()
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (tokenResult?.accessToken) {
    headers.set('Authorization', `Bearer ${tokenResult.accessToken}`)
  }

  const res = await fetch(
    `${API_URL}/api/v1/articles/${encodeURIComponent(json.article_id)}/view`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ visitor_id: json.visitor_id }),
      cache: 'no-store',
    },
  )

  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    },
  })
}
