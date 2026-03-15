import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:4000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${API_BASE}/api/v1/devis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? 'Erreur serveur', code: data.code },
        { status: res.status }
      )
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[devis] API error:', err)
    return NextResponse.json(
      { error: 'Erreur de connexion au serveur', code: 'NETWORK_ERROR' },
      { status: 500 }
    )
  }
}
