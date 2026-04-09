/**
 * Next.js 16 proxy: Auth0 handles /auth/* (admin) and /reader/auth/* (reader accounts).
 */
import { auth0 } from '@/lib/auth0'
import { readerAuth0 } from '@/lib/reader-auth0'

export async function proxy(request: Request) {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/reader/auth/')) {
    return await readerAuth0.middleware(request)
  }
  return await auth0.middleware(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
