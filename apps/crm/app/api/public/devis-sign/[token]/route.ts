import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function proxy(request: NextRequest, token: string): Promise<NextResponse> {
  const url = `${API_URL}/api/v1/public/devis-sign/${token}`
  const init: RequestInit = { method: request.method }
  if (request.method === 'POST') {
    init.body = await request.text()
    init.headers = { 'Content-Type': 'application/json' }
  }
  try {
    const res = await fetch(url, init)
    const body = await res.text()
    return new NextResponse(body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur réseau' }, { status: 502 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  return proxy(request, token)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  return proxy(request, token)
}
