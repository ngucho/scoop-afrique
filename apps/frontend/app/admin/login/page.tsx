import Link from 'next/link'
import { Heading, Button } from 'scoop'

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Heading as="h1" level="h1" className="mb-4">
        Espace employés
      </Heading>
      <p className="mb-8 text-center text-muted-foreground">
        Connexion sécurisée via Auth0. Utilisez vos identifiants pour accéder au backoffice.
      </p>
      <Button asChild size="lg">
        <a href="/auth/login?returnTo=/admin">Connexion avec Auth0</a>
      </Button>
      <Link href="/" className="mt-8 text-sm text-muted-foreground hover:text-foreground">
        ← Retour à l&apos;accueil
      </Link>
    </main>
  )
}
