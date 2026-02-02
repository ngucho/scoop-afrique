import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Redirection HTTP → HTTPS en production.
 * Les hébergeurs (Vercel, etc.) gèrent souvent HTTPS ; ce middleware agit en secours.
 */
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next()
  }

  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  const host = request.headers.get('x-forwarded-host') ?? request.nextUrl.host

  if (proto === 'http' && host) {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Exclure _next, static, api, et fichiers comme favicon.
     * Inclure toutes les pages pour appliquer la redirection HTTPS.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon\\.svg|apple-icon\\.png|og-image\\.png).*)',
  ],
}
