/**
 * Assign Auth0 "reader" role via Management API when a valid API token has no RBAC permissions yet.
 * The role must include API permission `access:reader` (configured in Auth0, not here).
 *
 * After assignment, the client must refresh the access token so `permissions` appears in the JWT.
 */
import { apiLog } from '@scoop-afrique/api-logger'
import { config } from '../config/env.js'
import { addAuth0UserRoles, listAuth0UserRoles } from './auth0-management.js'

export type ReaderBootstrapResult =
  | 'assigned'
  | 'already_had_reader'
  | 'skipped_no_config'
  | 'management_error'

/**
 * If the user does not yet have the configured reader role, assign it.
 * Returns `already_had_reader` when the role is already present (token still missing perms → RBAC/app config).
 */
export async function ensureReaderRoleViaManagement(auth0Sub: string): Promise<ReaderBootstrapResult> {
  const roleId = config.auth0ReaderRoleId
  if (!roleId || !config.auth0Management) {
    apiLog({
      ts: new Date().toISOString(),
      level: 'warn',
      msg: 'reader_bootstrap_skipped_no_config',
      has_role_id: Boolean(roleId),
      has_management: Boolean(config.auth0Management),
    })
    return 'skipped_no_config'
  }

  const roles = await listAuth0UserRoles(auth0Sub)
  if (roles === null) {
    apiLog({
      ts: new Date().toISOString(),
      level: 'warn',
      msg: 'reader_bootstrap_list_roles_failed',
      sub_prefix: auth0Sub.slice(0, 18),
    })
    return 'management_error'
  }

  const hasReader = roles.some((r) => r.id === roleId)
  if (hasReader) {
    return 'already_had_reader'
  }

  const ok = await addAuth0UserRoles(auth0Sub, [roleId])
  if (!ok) {
    apiLog({
      ts: new Date().toISOString(),
      level: 'warn',
      msg: 'reader_bootstrap_assign_failed',
      sub_prefix: auth0Sub.slice(0, 18),
    })
    return 'management_error'
  }

  apiLog({
    ts: new Date().toISOString(),
    level: 'info',
    msg: 'reader_bootstrap_reader_role_assigned',
    sub_prefix: auth0Sub.slice(0, 18),
  })
  return 'assigned'
}
