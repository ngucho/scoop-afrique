import Link from 'next/link'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { Heading, Text, Card, CardContent } from 'scoop'
import { getApiUrl } from '@/lib/api/client'

type ConfirmState = 'missing' | 'ok' | 'invalid' | 'error'

async function runConfirm(token: string): Promise<ConfirmState> {
  try {
    const url = getApiUrl(`/newsletter/confirm?token=${encodeURIComponent(token)}`)
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return 'error'
    const json = (await res.json()) as { data?: { success?: boolean } }
    return json?.data?.success ? 'ok' : 'invalid'
  } catch {
    return 'error'
  }
}

export default async function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  let state: ConfirmState = 'missing'
  if (token?.trim()) {
    state = await runConfirm(token.trim())
  }

  return (
    <ReaderLayout>
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <Card variant="default">
          <CardContent className="p-6 sm:p-8">
            {state === 'missing' && (
              <>
                <Heading as="h1" level="h2" className="text-xl font-semibold">
                  Lien incomplet
                </Heading>
                <Text variant="muted" className="mt-2">
                  Il manque le jeton de confirmation. Ouvrez le lien reçu par e-mail ou réessayez depuis la page
                  newsletter.
                </Text>
              </>
            )}
            {state === 'ok' && (
              <>
                <Heading as="h1" level="h2" className="text-xl font-semibold text-green-800">
                  Inscription confirmée
                </Heading>
                <Text variant="muted" className="mt-2">
                  Merci ! Vous recevrez bientôt nos actualités à cette adresse.
                </Text>
              </>
            )}
            {state === 'invalid' && (
              <>
                <Heading as="h1" level="h2" className="text-xl font-semibold">
                  Lien expiré ou déjà utilisé
                </Heading>
                <Text variant="muted" className="mt-2">
                  Ce lien de confirmation n’est plus valide. Vous pouvez vous réinscrire depuis la page newsletter.
                </Text>
              </>
            )}
            {state === 'error' && (
              <>
                <Heading as="h1" level="h2" className="text-xl font-semibold">
                  Erreur technique
                </Heading>
                <Text variant="muted" className="mt-2">
                  Impossible de confirmer pour le moment. Réessayez plus tard ou contactez-nous.
                </Text>
              </>
            )}
            <p className="mt-6">
              <Link href="/newsletter" className="text-sm font-medium text-[var(--color-accent)] underline">
                Retour à la newsletter
              </Link>
              {' · '}
              <Link href="/" className="text-sm font-medium text-[var(--color-accent)] underline">
                Accueil
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </ReaderLayout>
  )
}
