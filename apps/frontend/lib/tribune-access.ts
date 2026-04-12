/**
 * Tribune / reader API access tier from Auth0 API permissions.
 * Aligned with apps/backend/src/lib/api-permissions.ts and apps/frontend/lib/admin/staff-api-access.ts
 */
import { hasStaffApiAccess, READER_ACCOUNT_PERMISSION } from '@/lib/admin/staff-api-access'

export type TribuneAccess = 'reader' | 'staff_only' | 'anonymous'

export function resolveTribuneAccess(permissions: string[] | undefined | null): TribuneAccess {
  const list = Array.isArray(permissions) ? permissions : []
  if (list.includes(READER_ACCOUNT_PERMISSION)) return 'reader'
  if (hasStaffApiAccess(list)) return 'staff_only'
  return 'anonymous'
}
