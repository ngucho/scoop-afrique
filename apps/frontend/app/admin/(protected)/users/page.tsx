import { redirect } from 'next/navigation'
import { Heading, Card, CardContent } from 'scoop'
import { IconShield, IconExternalLink } from '@tabler/icons-react'
import { getAdminSession } from '@/lib/admin/session'
import { hasMinRole, ROLE_LABELS, ROLE_COLORS } from '@/lib/admin/rbac'

export default async function AdminUsersPage() {
  const adminSession = await getAdminSession()
  if (!adminSession || !hasMinRole(adminSession.role, 'admin')) {
    redirect('/admin')
  }

  return (
    <div className="space-y-6">
      <div>
        <Heading as="h1" level="h2">
          Gestion des utilisateurs
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          Administration complète des utilisateurs et des rôles.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <IconShield className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <Heading as="h3" level="h4">
              Auth0 Dashboard
            </Heading>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Auth0 est le fournisseur d&apos;identité unique pour Scoop Afrique.
              Toute la gestion des utilisateurs (création, suppression, attribution de
              rôles, réinitialisation de mots de passe) se fait dans le tableau de
              bord Auth0.
            </p>
            <a
              href="https://manage.auth0.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <IconExternalLink className="h-4 w-4" />
              Ouvrir le tableau de bord Auth0
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 font-semibold">Matrice des rôles</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium text-muted-foreground">Permission</th>
                  <th className="py-2 text-center font-medium text-muted-foreground">Journaliste</th>
                  <th className="py-2 text-center font-medium text-muted-foreground">Éditeur</th>
                  <th className="py-2 text-center font-medium text-muted-foreground">Manager</th>
                  <th className="py-2 text-center font-medium text-muted-foreground">Admin</th>
                </tr>
              </thead>
              <tbody className="[&_td]:py-2 [&_td]:text-center">
                {[
                  ['Créer des articles', true, true, true, true],
                  ['Modifier ses propres articles', true, true, true, true],
                  ['Modifier tous les articles', false, true, true, true],
                  ['Publier / programmer', false, true, true, true],
                  ['Supprimer des articles', false, false, true, true],
                  ['Modérer les commentaires', false, true, true, true],
                  ['Upload médias', true, true, true, true],
                  ['Gérer les catégories', false, false, true, true],
                  ['Gérer les équipes', false, false, true, true],
                  ['Gérer les utilisateurs', false, false, false, true],
                  ['Paramètres système', false, false, false, true],
                ].map(([label, j, e, m, a]) => (
                  <tr key={label as string} className="border-b border-border last:border-0">
                    <td className="text-left font-medium">{label as string}</td>
                    <td>{j ? '✓' : '—'}</td>
                    <td>{e ? '✓' : '—'}</td>
                    <td>{m ? '✓' : '—'}</td>
                    <td>{a ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
