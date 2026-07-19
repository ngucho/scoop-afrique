import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function POST(request: NextRequest) {
  const json = (await request.json().catch(() => null)) as { article_id?: string } | null
  const articleId = json?.article_id?.trim()
  if (!articleId) {
    return NextResponse.json({ error: 'article_id required' }, { status: 400 })
  }

  const res = await fetch(`${API_URL}/api/v1/articles/${encodeURIComponent(articleId)}/audio-access`, {
    method: 'POST',
    cache: 'no-store',
  })

  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
      'cache-control': 'private, no-store',
    },
  })
}
