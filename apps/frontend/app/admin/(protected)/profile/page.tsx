import { redirect } from 'next/navigation'
import { Heading, Card, CardContent, Avatar } from 'scoop'
import { IconUser, IconMail, IconShield } from '@tabler/icons-react'
import { getAdminSession } from '@/lib/admin/session'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/admin/rbac'
import { MetadataForm } from './MetadataForm'
import { PasswordForm } from './PasswordForm'

export default async function AdminProfilePage() {
  const adminSession = await getAdminSession()
  if (!adminSession) redirect('/admin/login')

  const { email, name, avatar, role, metadata } = adminSession

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Heading as="h1" level="h2">
        Mon profil
      </Heading>

      {/* Identity card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Avatar
              src={avatar}
              alt={name || email}
              fallback={<IconUser className="h-8 w-8" />}
              size="lg"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold">{name || email}</h2>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <IconMail className="h-3.5 w-3.5" />
                  {email}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}
                >
                  <IconShield className="h-3 w-3" />
                  {ROLE_LABELS[role]}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable personal info (stored in Auth0 user_metadata) */}
      <MetadataForm initialMetadata={metadata} />

      {/* Password change */}
      <PasswordForm />

      {/* Account info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 font-semibold">Informations du compte</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Rôle</dt>
              <dd className="mt-0.5 text-sm">
                {ROLE_LABELS[role]} — Les rôles sont gérés dans Auth0 par un administrateur.
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent className="p-6">
          <a
            href="/auth/logout"
            className="inline-block rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Se déconnecter
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
