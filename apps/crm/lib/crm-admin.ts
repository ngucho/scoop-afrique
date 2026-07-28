import { getAccessToken } from '@/lib/auth0'
import {
  crmCapabilities,
  roleFromPermissions,
  type CrmRole,
} from '@/lib/rbac'

/**
 * Nom historique utilisé par les pages d'archives.
 * La capacité réelle est manage:crm, pas un rôle admin.
 */
export async function getCrmIsAdmin(): Promise<boolean> {
  return getCrmCanManage()
}

export async function getCrmCanManage(): Promise<boolean> {
  const tokenResult = await getAccessToken()
  const permissions = tokenResult?.permissions ?? []
  return crmCapabilities(permissions).canManage
}

/** CRM role for server components (same mapping as backend). */
export async function getCrmRole(): Promise<CrmRole> {
  const tokenResult = await getAccessToken()
  const permissions = tokenResult?.permissions ?? []
  return roleFromPermissions(permissions)
}

