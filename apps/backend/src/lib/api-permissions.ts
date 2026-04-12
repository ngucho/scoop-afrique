/**
 * Auth0 API permissions — staff vs reader.
 * Keep in sync with docs/AUTH0_SETUP.md and apps/frontend/lib/admin/staff-api-access.ts
 */

/** Single permission for the Reader Auth0 application / `reader` role (subscriber account APIs only). */
export const READER_ACCOUNT_PERMISSION = 'access:reader'

/**
 * Permissions that indicate an employee (backoffice / staff API access).
 * Tokens used on staff routes must include at least one of these.
 */
export const STAFF_API_PERMISSIONS = [
  'read:articles',
  'create:articles',
  'update:articles',
  'delete:articles',
  'publish:articles',
  'read:media',
  'create:media',
  'delete:media',
  'read:users',
  'manage:users',
  'read:crm',
  'write:crm',
  'manage:crm',
] as const

const STAFF_SET = new Set<string>(STAFF_API_PERMISSIONS)

export function hasStaffApiAccess(permissions: string[]): boolean {
  return permissions.some((p) => STAFF_SET.has(p))
}

export function hasReaderAccountPermission(permissions: string[]): boolean {
  return permissions.includes(READER_ACCOUNT_PERMISSION)
}

/**
 * Strict “subscriber-only” check (no employee permissions). Unused by `/api/v1/reader/*`
 * since 2026-04: those routes accept `access:reader` even when staff permissions are also
 * present. Kept for tooling and future policies.
 */
export function isReaderAccountOnly(permissions: string[]): boolean {
  return hasReaderAccountPermission(permissions) && !hasStaffApiAccess(permissions)
}
