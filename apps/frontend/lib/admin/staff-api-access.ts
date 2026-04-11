/**
 * Staff vs reader permissions (Auth0 API).
 * Must stay aligned with apps/backend/src/lib/api-permissions.ts and docs/AUTH0_SETUP.md.
 */

export const READER_ACCOUNT_PERMISSION = 'access:reader'

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

/** True if the token grants at least one employee / backoffice permission. */
export function hasStaffApiAccess(permissions: string[]): boolean {
  return permissions.some((p) => STAFF_SET.has(p))
}
