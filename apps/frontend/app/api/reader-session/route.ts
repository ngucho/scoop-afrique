import { NextResponse } from 'next/server'
import { getReaderAccessToken, getReaderSession } from '@/lib/reader-auth0'
import { resolveTribuneAccess, type TribuneAccess } from '@/lib/tribune-access'

export async function GET() {
  const session = await getReaderSession()
  if (!session?.user) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      tribune_access: 'anonymous' satisfies TribuneAccess,
    })
  }
  const tokenResult = await getReaderAccessToken()
  const tribune_access = resolveTribuneAccess(tokenResult?.permissions)
  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      picture: session.user.picture ?? null,
    },
    tribune_access,
  })
}
