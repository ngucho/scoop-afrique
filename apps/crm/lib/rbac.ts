/**
 * RBAC helpers for the CRM app.
 * Role is derived from Auth0 JWT permissions (same mapping as backend apps/backend/src/lib/auth0.ts).
 */

export type CrmRole = 'journalist' | 'editor' | 'manager' | 'admin'

/** CRM permissions (must match backend) */
export const CRM_PERMISSIONS = {
  read: 'read:crm',
  write: 'write:crm',
  manage: 'manage:crm',
} as const

/**
 * Derive role from Auth0 permissions (must match backend apps/backend/src/lib/auth0.ts).
 */
export function roleFromPermissions(permissions: string[]): CrmRole {
  if (permissions.includes('manage:users')) return 'admin'
  if (permissions.includes('delete:articles') || permissions.includes('manage:crm')) return 'manager'
  if (
    permissions.includes('publish:articles') ||
    permissions.includes('write:crm') ||
    permissions.includes('read:crm')
  )
    return 'editor'
  if (
    permissions.includes('create:articles') ||
    permissions.includes('read:articles')
  )
    return 'journalist'
  return 'journalist'
}

/** Check if user has read:crm permission (minimum for CRM access) */
export function hasReadCrm(permissions: string[]): boolean {
  return permissions.includes(CRM_PERMISSIONS.read)
}

/** Check if user has write:crm permission */
export function hasWriteCrm(permissions: string[]): boolean {
  return permissions.includes(CRM_PERMISSIONS.write)
}

/** Check if user has manage:crm permission */
export function hasManageCrm(permissions: string[]): boolean {
  return permissions.includes(CRM_PERMISSIONS.manage)
}
