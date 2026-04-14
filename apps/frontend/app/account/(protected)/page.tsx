import { redirect } from 'next/navigation'
import {
  getReaderAccessToken,
  getReaderSession,
  readerLogoutHref,
  refreshReaderAccessToken,
} from '@/lib/reader-auth0'
import { AccountPreferences, type ReaderAccount, type ReaderPublicProfile } from './AccountPreferences'
import type { Category } from '@/lib/api/types'

const SESSION_REFRESH_NEEDED = 'SESSION_REFRESH_NEEDED'

type ReaderMeResult =
  | { ok: true; data: ReaderAccount & { profile?: ReaderPublicProfile | null } }
  | { ok: false; code?: string }

async function fetchReaderMe(token: string): Promise<ReaderMeResult> {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  const url = `${api}/api/v1/reader/me`
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.ok) {
      const json = (await res.json()) as { data?: ReaderAccount & { profile?: ReaderPublicProfile | null } }
      if (json.data) return { ok: true, data: json.data }
      return { ok: false }
    }

    let code: string | undefined
    try {
      const err = (await res.json()) as { code?: string }
      code = err.code
    } catch {
      /* ignore */
    }
    return { ok: false, code }
  } catch {
    return { ok: false }
  }
}

async function loadReaderAccount(token: string): Promise<ReaderMeResult> {
  let result = await fetchReaderMe(token)
  if (!result.ok && result.code === SESSION_REFRESH_NEEDED) {
    const refreshed = await refreshReaderAccessToken()
    if (refreshed) {
      const next = await getReaderAccessToken()
      if (next?.accessToken) {
        result = await fetchReaderMe(next.accessToken)
      }
    }
  }
  return result
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

function AccountLoadError() {
  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16 text-center">
      <p className="text-muted-foreground">
        Impossible d&apos;afficher votre espace pour le moment. Si le problème continue, déconnectez-vous puis
        reconnectez-vous.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href={readerLogoutHref('/account/login')}
          className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
        >
          Me déconnecter
        </a>
        <a href="/reader/auth/login?returnTo=/account" className="text-sm font-medium text-primary underline">
          Me reconnecter
        </a>
      </div>
    </div>
  )
}

export default async function AccountPage() {
  const session = await getReaderSession()
  if (!session?.user) redirect('/account/login')

  const token = await getReaderAccessToken()
  if (!token?.accessToken) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground mb-6">
          Votre session doit être renouvelée pour accéder à vos préférences.
        </p>
        <a href="/reader/auth/login?returnTo=/account" className="font-medium text-primary underline">
          Se reconnecter
        </a>
      </div>
    )
  }

  const [meResult, categories] = await Promise.all([loadReaderAccount(token.accessToken), fetchCategories()])
  if (!meResult.ok) {
    return <AccountLoadError />
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

  return <AccountPreferences initial={meResult.data} categories={categories} apiBaseUrl={apiBase} />
}
