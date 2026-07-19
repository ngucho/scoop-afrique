import { NextRequest, NextResponse } from 'next/server'
import { getReaderAccessToken } from '@/lib/reader-auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get('article_id')?.trim()
  if (!articleId) {
    return NextResponse.json({ error: 'article_id required' }, { status: 400 })
  }

  const history = request.nextUrl.searchParams
    .get('history')
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 40)
    .join(',')

  const url = new URL(`/api/v1/articles/recommendations/${encodeURIComponent(articleId)}`, API_URL)
  if (history) url.searchParams.set('history', history)

  const tokenResult = await getReaderAccessToken().catch(() => null)
  const res = await fetch(url.toString(), {
    headers: {
      ...(tokenResult?.accessToken ? { Authorization: `Bearer ${tokenResult.accessToken}` } : {}),
    },
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
