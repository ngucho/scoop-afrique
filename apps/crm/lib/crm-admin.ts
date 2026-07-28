import { getAccessToken } from '@/lib/auth0'
import { redirect } from 'next/navigation'
import {
  crmCapabilities,
  type CrmCapabilities,
} from '@/lib/rbac'

/**
 * Nom historique utilisé par les pages d'archives.
 * La capacité réelle est manage:crm, pas un rôle admin.
 */
export async function getCrmIsAdmin(): Promise<boolean> {
  return getCrmCanManage()
}

export async function getCrmCanManage(): Promise<boolean> {
  return (await getCrmCapabilities()).canManage
}

export async function getCrmCapabilities(): Promise<CrmCapabilities> {
  const tokenResult = await getAccessToken()
  const permissions = tokenResult?.permissions ?? []
  return crmCapabilities(permissions)
}

export async function requireCrmWrite(): Promise<void> {
  if (!(await getCrmCapabilities()).canWrite) redirect('/dashboard')
}

export async function requireCrmManage(): Promise<void> {
  if (!(await getCrmCapabilities()).canManage) redirect('/dashboard')
}

