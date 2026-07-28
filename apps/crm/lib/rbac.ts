/** Exact Auth0 permission helpers for the CRM app and BFF. */

/** CRM permissions (must match backend) */
export const CRM_PERMISSIONS = {
  read: 'read:crm',
  write: 'write:crm',
  manage: 'manage:crm',
} as const

export type CrmPermission =
  (typeof CRM_PERMISSIONS)[keyof typeof CRM_PERMISSIONS]

export interface CrmCapabilities {
  canRead: boolean
  canWrite: boolean
  canManage: boolean
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

export function crmCapabilities(
  permissions: string[],
): CrmCapabilities {
  return {
    canRead: hasReadCrm(permissions),
    canWrite: hasWriteCrm(permissions),
    canManage: hasManageCrm(permissions),
  }
}

const restorePattern =
  /^\/(?:contacts|devis|projects|invoices|contracts)\/[^/]+\/restore$/
const projectClosePattern = /^\/projects\/[^/]+\/close$/
const devisConvertPattern = /^\/devis\/[^/]+\/convert$/
const contractSignPattern = /^\/contracts\/[^/]+\/sign$/

function normalizeCrmPath(requestPath: string): string {
  const path = requestPath.split(/[?#]/, 1)[0] ?? ''
  const withoutBffPrefix = path.replace(/^\/?api\/crm(?=\/|$)/, '')
  return `/${withoutBffPrefix.replace(/^\/+/, '')}`
}

export function requiredCrmPermission(
  method: string,
  requestPath: string,
): CrmPermission {
  const verb = method.toUpperCase()
  const path = normalizeCrmPath(requestPath)

  if (verb === 'GET' || verb === 'HEAD' || verb === 'OPTIONS') {
    return CRM_PERMISSIONS.read
  }
  if (verb === 'DELETE') return CRM_PERMISSIONS.manage
  if (
    path.startsWith('/settings') ||
    path.startsWith('/treasury') ||
    path.startsWith('/services')
  ) {
    return CRM_PERMISSIONS.manage
  }
  if (verb === 'POST' && (path === '/projects' || path === '/contracts')) {
    return CRM_PERMISSIONS.manage
  }
  if (
    restorePattern.test(path) ||
    projectClosePattern.test(path) ||
    devisConvertPattern.test(path) ||
    contractSignPattern.test(path)
  ) {
    return CRM_PERMISSIONS.manage
  }
  return CRM_PERMISSIONS.write
}

export function canCrmRequest(
  permissions: string[],
  method: string,
  requestPath: string,
): boolean {
  return permissions.includes(requiredCrmPermission(method, requestPath))
}
