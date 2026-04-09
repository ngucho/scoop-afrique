import Link from 'next/link'
import { Heading, Button } from 'scoop'

export default function AccountLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Heading as="h1" level="h1" className="mb-4">
        Mon compte lecteur
      </Heading>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        Connectez-vous pour gérer votre profil, vos thématiques et la fréquence du digest email.
      </p>
      <Button asChild size="lg">
        <a href="/reader/auth/login?returnTo=/account">Connexion</a>
      </Button>
      <Link href="/" className="mt-8 text-sm text-muted-foreground hover:text-foreground">
        ← Retour à l&apos;accueil
      </Link>
    </main>
  )
}
