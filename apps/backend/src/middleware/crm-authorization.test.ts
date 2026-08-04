import test from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import {
  requireCrmPermission,
  requiredCrmPermission,
} from './crm-authorization.js'
import type { CrmPermission } from '../lib/api-permissions.js'

const cases: Array<[string, string, CrmPermission]> = [
  ['GET', '/api/v1/crm/contacts', 'read:crm'],
  ['GET', '/api/v1/crm/invoices/123/pdf', 'read:crm'],
  ['POST', '/api/v1/crm/contacts', 'write:crm'],
  ['PATCH', '/api/v1/crm/invoices/123', 'write:crm'],
  ['POST', '/api/v1/crm/invoices/123/send', 'write:crm'],
  ['POST', '/api/v1/crm/projects', 'manage:crm'],
  ['DELETE', '/api/v1/crm/contacts/123', 'manage:crm'],
  ['POST', '/api/v1/crm/contacts/123/restore', 'manage:crm'],
  ['POST', '/api/v1/crm/projects/123/close', 'manage:crm'],
  ['GET', '/api/v1/crm/projects/123/closure-preview', 'manage:crm'],
  ['POST', '/api/v1/crm/projects/123/close-and-archive', 'manage:crm'],
  ['POST', '/api/v1/crm/projects/123/create-follow-up', 'manage:crm'],
  ['GET', '/api/v1/crm/projects/archive-reconciliation', 'manage:crm'],
  ['POST', '/api/v1/crm/devis/123/convert', 'manage:crm'],
  ['POST', '/api/v1/crm/contracts', 'manage:crm'],
  ['PATCH', '/api/v1/crm/contracts/123/sign', 'manage:crm'],
  ['POST', '/api/v1/crm/services', 'manage:crm'],
  ['PATCH', '/api/v1/crm/services/123', 'manage:crm'],
  ['PUT', '/api/v1/crm/settings/company-info', 'manage:crm'],
  ['POST', '/api/v1/crm/settings/reminder-rules', 'manage:crm'],
  ['POST', '/api/v1/crm/treasury', 'manage:crm'],
  ['PATCH', '/api/v1/crm/treasury/123', 'manage:crm'],
]

for (const [method, path, expected] of cases) {
  test(`${method} ${path} requires ${expected}`, () => {
    assert.equal(requiredCrmPermission(method, path), expected)
  })
}

async function requestWith(
  permissions: string[],
  method: string,
  path: string,
) {
  const crm = new Hono()
  crm.use('*', async (c, next) => {
    c.set('user' as never, {
      id: 'profile-1',
      auth0_id: 'auth0|user',
      email: 'user@scoop-afrique.com',
      role: 'admin',
      permissions,
    } as never)
    await next()
  })
  crm.use('*', requireCrmPermission)
  crm.all('*', (c) => c.json({ ok: true }))

  const root = new Hono()
  root.route('/api/v1/crm', crm)
  return root.request(path, { method })
}

test('read-only CRM permission cannot mutate', async () => {
  assert.equal(
    (await requestWith(['read:crm'], 'GET', '/api/v1/crm/contacts')).status,
    200,
  )
  assert.equal(
    (await requestWith(['read:crm'], 'POST', '/api/v1/crm/contacts')).status,
    403,
  )
})

test('write permission cannot administer CRM', async () => {
  const permissions = ['read:crm', 'write:crm']
  assert.equal(
    (await requestWith(permissions, 'PATCH', '/api/v1/crm/contacts/1')).status,
    200,
  )
  assert.equal(
    (await requestWith(permissions, 'DELETE', '/api/v1/crm/contacts/1')).status,
    403,
  )
  assert.equal(
    (
      await requestWith(
        permissions,
        'PUT',
        '/api/v1/crm/settings/company-info',
      )
    ).status,
    403,
  )
})

test('cumulative manage permissions can administer CRM', async () => {
  const permissions = ['read:crm', 'write:crm', 'manage:crm']
  assert.equal(
    (
      await requestWith(
        permissions,
        'POST',
        '/api/v1/crm/projects/1/restore',
      )
    ).status,
    200,
  )
  assert.equal(
    (await requestWith(permissions, 'POST', '/api/v1/crm/treasury')).status,
    200,
  )
})

test('manage permission does not implicitly grant read or write', async () => {
  assert.equal(
    (await requestWith(['manage:crm'], 'GET', '/api/v1/crm/contacts')).status,
    403,
  )
  assert.equal(
    (await requestWith(['manage:crm'], 'POST', '/api/v1/crm/contacts')).status,
    403,
  )
  assert.equal(
    (
      await requestWith(
        ['manage:crm'],
        'DELETE',
        '/api/v1/crm/contacts/1',
      )
    ).status,
    200,
  )
})
