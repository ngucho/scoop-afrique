import { redirect } from 'next/navigation'
import { Heading, Card, CardContent } from 'scoop'
import { IconUsers, IconUserPlus } from '@tabler/icons-react'
import { getAdminSession } from '@/lib/admin/session'
import { fetchAuth0Users } from '@/lib/admin/fetchers'
import { hasMinRole, ROLE_LABELS, ROLE_COLORS } from '@/lib/admin/rbac'

export default async function AdminTeamPage() {
  const adminSession = await getAdminSession()
  if (!adminSession || !hasMinRole(adminSession.role, 'manager')) {
    redirect('/admin')
  }

  const { data: auth0Users, total: auth0Total } = await fetchAuth0Users(0, 100)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="h1" level="h2">
            Gestion d&apos;équipe
          </Heading>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les membres de la rédaction et les affectations.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <IconUserPlus className="h-4 w-4" />
          Inviter un membre
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <IconUsers className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <Heading as="h3" level="h4">
              Gestion d&apos;équipe
            </Heading>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              La gestion des utilisateurs est effectuée via le tableau de bord Auth0.
              Invitez de nouveaux membres dans Auth0 et attribuez-leur les rôles
              appropriés (journaliste, éditeur, manager, admin).
            </p>
            <div className="mx-auto mt-6 grid max-w-lg gap-3 sm:grid-cols-2">
              {(['journalist', 'editor', 'manager', 'admin'] as const).map((role) => (
                <div
                  key={role}
                  className="rounded-lg border border-border p-4 text-left"
                >
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}>
                    {ROLE_LABELS[role]}
                  </span>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {role === 'journalist' && 'Crée et soumet des articles.'}
                    {role === 'editor' && 'Révise, publie, modère les commentaires.'}
                    {role === 'manager' && 'Gère les équipes, catégories, supprime.'}
                    {role === 'admin' && "Accès complet au système et paramètres."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs Auth0 — pour les ajouter en collaborateurs ou à l'équipe */}
      <Card>
        <CardContent className="p-6">
          <Heading as="h3" level="h4" className="mb-2">
            Utilisateurs Auth0
          </Heading>
          <p className="mb-4 text-sm text-muted-foreground">
            Liste des utilisateurs ayant accès à l&apos;application. Utilisez leur email pour les ajouter comme
            collaborateurs sur un article (depuis l&apos;éditeur d&apos;article).
          </p>
          {auth0Users.length > 0 ? (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80">
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Nom</th>
                  </tr>
                </thead>
                <tbody>
                  {auth0Users.map((u) => (
                    <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{u.email ?? '—'}</td>
                      <td className="px-4 py-2 text-muted-foreground">{u.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun utilisateur récupéré (vérifiez la configuration Auth0 Management API).
            </p>
          )}
          {auth0Total > auth0Users.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              {auth0Total} utilisateur(s) au total dans Auth0.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
