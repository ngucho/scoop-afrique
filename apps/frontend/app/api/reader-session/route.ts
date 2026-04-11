import { NextResponse } from 'next/server'
import { getReaderSession } from '@/lib/reader-auth0'

export async function GET() {
  const session = await getReaderSession()
  if (!session?.user) {
    return NextResponse.json({ authenticated: false, user: null })
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      picture: session.user.picture ?? null,
    },
  })
}
