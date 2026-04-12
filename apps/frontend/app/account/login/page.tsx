import Link from 'next/link'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { EditorialAccountGate, Button } from 'scoop'

export default function AccountLoginPage() {
  return (
    <ReaderLayout>
      <EditorialAccountGate
        title="Connexion"
        description="Connectez-vous pour gérer votre profil, vos rubriques et la fréquence du digest."
        actions={
          <>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="/reader/auth/login?returnTo=/account">Se connecter</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-border sm:w-auto">
              <a href="/reader/auth/login?returnTo=/account&screen_hint=signup">Inscription</a>
            </Button>
          </>
        }
        footer={
          <>
            <Link href="/" className="block hover:text-foreground">
              Retour à l&apos;accueil
            </Link>
            <Link href="/tribune" className="mt-4 block text-primary hover:underline">
              Tribune Scoop.Afrique
            </Link>
          </>
        }
      />
    </ReaderLayout>
  )
}
