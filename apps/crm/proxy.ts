/**
 * Next.js 16 proxy: Auth0 handles /auth/login, /auth/callback, /auth/logout, etc.
 */
import { auth0 } from '@/lib/auth0'

export async function proxy(request: Request) {
  return await auth0.middleware(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
