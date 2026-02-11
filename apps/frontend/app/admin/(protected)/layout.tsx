import { redirect } from 'next/navigation'
import { getSession, getAccessToken, getAccessTokenPayload, getUserMetadataFromPayload } from '@/lib/auth0'
import { AdminLayoutClient } from '../AdminLayoutClient'
import { AdminUserProvider, type AdminUser } from '@/lib/admin/UserContext'
import { roleFromPermissions, type AppRole } from '@/lib/admin/rbac'
import type { UserMetadata } from '@/lib/admin/session'

const ADMIN_LOGIN = '/admin/login'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Step 1: Session (must be logged in)
  const session = await getSession()
  if (!session?.user) {
    redirect(ADMIN_LOGIN)
  }

  // Step 2: Access token (redirect to login so user can re-authenticate)
  const tokenResult = await getAccessToken()
  if (!tokenResult?.accessToken) {
    redirect(ADMIN_LOGIN)
  }

  // Step 3: Permissions from JWT (required for admin access)
  const permissions = Array.isArray(tokenResult.permissions)
    ? tokenResult.permissions
    : []
  if (permissions.length === 0) {
    redirect(ADMIN_LOGIN)
  }

  // Step 4: Role from permissions
  const role: AppRole = roleFromPermissions(permissions)

  // Step 5: User metadata from access token payload (user_metadata lives there)
  const payload = await getAccessTokenPayload()
  const rawMeta = payload ? getUserMetadataFromPayload(payload) : {}
  const metadata: UserMetadata = {
    name: rawMeta.name ?? undefined,
    address: rawMeta.address ?? undefined,
    phone: rawMeta.phone ?? undefined,
    sex: rawMeta.sex ?? undefined,
  }

  const adminUser: AdminUser = {
    email: session.user.email ?? '',
    name: metadata.name ?? session.user.name ?? undefined,
    avatar: session.user.picture ?? undefined,
    role,
    permissions: permissions as readonly string[],
    metadata,
  }

  return (
    <AdminUserProvider initialUser={adminUser}>
      <AdminLayoutClient
        userEmail={adminUser.email}
        userName={adminUser.name}
        userAvatar={adminUser.avatar}
        userRole={role}
      >
        {children}
      </AdminLayoutClient>
    </AdminUserProvider>
  )
}
