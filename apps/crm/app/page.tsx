import { redirect } from 'next/navigation'
import { getSession, getAccessToken } from '@/lib/auth0'
import { hasReadCrm } from '@/lib/rbac'

export default async function HomePage() {
  const session = await getSession()
  if (!session?.user) {
    redirect('/login')
  }
  const tokenResult = await getAccessToken()
  const permissions = Array.isArray(tokenResult?.permissions) ? tokenResult.permissions : []
  if (hasReadCrm(permissions)) {
    redirect('/dashboard')
  }
  redirect('/login')
}
