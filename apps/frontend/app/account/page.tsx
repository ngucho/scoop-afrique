import Link from 'next/link'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { EditorialAccountGate, Button } from 'scoop'

export default function AccountHubPage() {
  return (
    <ReaderLayout>
      <EditorialAccountGate
        title="Mon compte lecteur"
        description="Connectez-vous pour enrichir votre expérience : préférences, digest et participation à la tribune."
        actions={
          <>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="/reader/auth/login?returnTo=/account">Connexion</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-border sm:w-auto">
              <a href="/reader/auth/login?returnTo=/account&screen_hint=signup">Créer un compte</a>
            </Button>
          </>
        }
        footer={
          <Link href="/" className="text-primary underline-offset-4 hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        }
      />
    </ReaderLayout>
  )
}
