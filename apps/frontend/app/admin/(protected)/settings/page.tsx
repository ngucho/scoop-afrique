import Link from 'next/link'
import { Heading, Card, CardContent, Button } from 'scoop'
import { IconSettings, IconDatabase, IconShield, IconWorld, IconUser } from '@tabler/icons-react'
import { getAdminSession } from '@/lib/admin/session'
import { hasMinRole } from '@/lib/admin/rbac'

export default async function AdminSettingsPage() {
  const adminSession = await getAdminSession()
  if (!adminSession) return null

  const isAdmin = hasMinRole(adminSession.role, 'admin')

  return (
    <div className="space-y-6">
      <div>
        <Heading as="h1" level="h2">
          Paramètres
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          Informations personnelles et configuration système.
        </p>
      </div>

      {/* Account — visible to all users */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <IconUser className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Compte et informations personnelles</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Modifier vos informations personnelles (nom, adresse, téléphone, sexe) et changer votre mot de passe.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/admin/profile">Mon profil</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System config — admin only */}
      {isAdmin && (
        <>
          <Heading as="h2" level="h4" className="mt-8">
            Paramètres système
          </Heading>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-blue-100 p-2.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <IconDatabase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Base de données</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Supabase PostgreSQL. Migrations gérées via{' '}
                      <code className="rounded bg-muted px-1 text-xs">supabase/migrations/</code>.
                    </p>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      Dashboard Supabase →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <IconShield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Authentification</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Auth0 — fournisseur d&apos;identité unique. Rôles et permissions gérés dans Auth0.
                    </p>
                    <a
                      href="https://manage.auth0.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      Dashboard Auth0 →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-purple-100 p-2.5 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <IconWorld className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Déploiement</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Frontend déployé sur Vercel. Backend sur Railway/Render.
                      Analytics via Vercel Analytics.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <IconSettings className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Configuration</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Variables d&apos;environnement gérées via <code className="rounded bg-muted px-1 text-xs">.env</code>.
                      Ne jamais commiter les secrets.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
