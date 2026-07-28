import type { Context, Next } from 'hono'
import { config } from '../config/env.js'
import {
  CRM_PERMISSIONS,
  type CrmPermission,
} from '../lib/api-permissions.js'
import { requirePermission } from './auth.js'

function relativeCrmPath(requestPath: string, apiPrefix: string): string {
  const root = `${apiPrefix.replace(/\/+$/, '')}/crm`
  if (!requestPath.startsWith(root)) return requestPath
  return requestPath.slice(root.length) || '/'
}

const restorePattern =
  /^\/(?:contacts|devis|projects|invoices|contracts)\/[^/]+\/restore$/
const projectClosePattern = /^\/projects\/[^/]+\/close$/
const devisConvertPattern = /^\/devis\/[^/]+\/convert$/
const contractSignPattern = /^\/contracts\/[^/]+\/sign$/

export function requiredCrmPermission(
  method: string,
  requestPath: string,
  apiPrefix = '/api/v1',
): CrmPermission {
  const verb = method.toUpperCase()
  const path = relativeCrmPath(requestPath, apiPrefix)

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

export async function requireCrmPermission(c: Context, next: Next) {
  const permission = requiredCrmPermission(
    c.req.method,
    c.req.path,
    config.apiPrefix,
  )
  return requirePermission(permission)(c, next)
}
