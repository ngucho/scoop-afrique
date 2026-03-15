import { redirect } from 'next/navigation'
import { getSession, getAccessToken } from '@/lib/auth0'
import { hasReadCrm } from '@/lib/rbac'
import { CrmLayoutClient } from '@/components/layout/CrmLayoutClient'

const LOGIN_PAGE = '/login'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session?.user) {
    redirect(LOGIN_PAGE)
  }

  const tokenResult = await getAccessToken()
  if (!tokenResult?.accessToken) {
    redirect(LOGIN_PAGE)
  }

  const permissions = Array.isArray(tokenResult.permissions) ? tokenResult.permissions : []
  if (!hasReadCrm(permissions)) {
    redirect(LOGIN_PAGE)
  }

  const user = session.user

  return (
    <CrmLayoutClient
      userEmail={user.email ?? undefined}
      userName={user.name ?? undefined}
      userAvatar={user.picture ?? undefined}
    >
      {children}
    </CrmLayoutClient>
  )
}
