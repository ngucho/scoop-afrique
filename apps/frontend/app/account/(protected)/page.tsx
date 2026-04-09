import { redirect } from 'next/navigation'
import { getReaderAccessToken, getReaderSession } from '@/lib/reader-auth0'
import { AccountPreferences, type ReaderAccount } from './AccountPreferences'
import type { Category } from '@/lib/api/types'

async function fetchReaderMe(token: string): Promise<ReaderAccount | null> {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  const res = await fetch(`${api}/api/v1/reader/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = (await res.json()) as { data?: ReaderAccount }
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
  if (!token?.accessToken) redirect('/account/login')

  const [me, categories] = await Promise.all([fetchReaderMe(token.accessToken), fetchCategories()])
  if (!me) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">
          Impossible de charger votre compte. Vérifiez la configuration du serveur ou reconnectez-vous.
        </p>
        <a href="/account/login" className="text-primary underline">
          Retour à la connexion
        </a>
      </div>
    )
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

  return <AccountPreferences initial={me} categories={categories} apiBaseUrl={apiBase} />
}
