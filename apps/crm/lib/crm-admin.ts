import { getAccessToken } from '@/lib/auth0'
import { roleFromPermissions, type CrmRole } from '@/lib/rbac'

/**
 * Admin check for server components.
 * Uses Auth0 JWT permissions mapped to the CRM role model.
 */
export async function getCrmIsAdmin(): Promise<boolean> {
  const tokenResult = await getAccessToken()
  const permissions = tokenResult?.permissions ?? []
  return roleFromPermissions(permissions) === 'admin'
}

/** CRM role for server components (same mapping as backend). */
export async function getCrmRole(): Promise<CrmRole> {
  const tokenResult = await getAccessToken()
  const permissions = tokenResult?.permissions ?? []
  return roleFromPermissions(permissions)
}

