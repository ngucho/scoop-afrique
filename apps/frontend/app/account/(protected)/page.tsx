import { redirect } from 'next/navigation'
import { getReaderAccessToken, getReaderSession } from '@/lib/reader-auth0'
import { AccountPreferences, type ReaderAccount, type ReaderPublicProfile } from './AccountPreferences'
import type { Category } from '@/lib/api/types'

async function fetchReaderMe(token: string): Promise<ReaderAccount | null> {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  const res = await fetch(`${api}/api/v1/reader/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = (await res.json()) as { data?: ReaderAccount & { profile?: ReaderPublicProfile | null } }
  return json.data ?? null
}

async function fetchCategories(): Promise<Category[]> {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  const res = await fetch(`${api}/api/v1/categories`, {
    next: { revalidate: 600 },
  })
  if (!res.ok) return []
  const json = (await res.json()) as { data?: Category[] }
  return json.data ?? []
}

export default async function AccountPage() {
  const session = await getReaderSession()
  if (!session?.user) redirect('/account/login')

  const token = await getReaderAccessToken()
  if (!token?.accessToken) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">
          Votre session est active mais le jeton d&apos;accès API a expiré ou est indisponible. Reconnectez-vous pour
          charger vos préférences (Auth0 audience / refresh).
        </p>
        <a href="/reader/auth/login?returnTo=/account" className="font-medium text-primary underline">
          Se reconnecter
        </a>
      </div>
    )
  }

  const [me, categories] = await Promise.all([fetchReaderMe(token.accessToken), fetchCategories()])
  if (!me) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
        <p className="text-muted-foreground">
          Impossible de charger votre espace lecteur (serveur injoignable ou session à renouveler). Vous pouvez vous
          déconnecter pour effacer la session sur cet appareil, puis vous reconnecter.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="/reader/auth/logout?returnTo=/account/login"
            className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
          >
            Me déconnecter (session lecteur)
          </a>
          <a href="/reader/auth/login?returnTo=/account" className="text-sm font-medium text-primary underline">
            Me reconnecter
          </a>
        </div>
      </div>
    )
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

  return <AccountPreferences initial={me} categories={categories} apiBaseUrl={apiBase} />
}
