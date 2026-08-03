import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canCrmRequest,
  crmCapabilities,
  requiredCrmPermission,
} from './rbac.js'

test('read-only CRM users cannot write or manage', () => {
  assert.deepEqual(crmCapabilities(['read:crm']), {
    canRead: true,
    canWrite: false,
    canManage: false,
  })
})

test('write CRM users do not receive manage access', () => {
  assert.deepEqual(crmCapabilities(['read:crm', 'write:crm']), {
    canRead: true,
    canWrite: true,
    canManage: false,
  })
  assert.deepEqual(crmCapabilities(['write:crm']), {
    canRead: false,
    canWrite: true,
    canManage: false,
  })
})

test('manage access comes only from manage:crm', () => {
  assert.deepEqual(crmCapabilities(['manage:crm']), {
    canRead: false,
    canWrite: false,
    canManage: true,
  })
  assert.equal(crmCapabilities(['manage:users']).canManage, false)
  assert.equal(crmCapabilities(['delete:articles']).canManage, false)
})

const requestCases = [
  ['GET', 'contacts', 'read:crm'],
  ['HEAD', '/api/crm/invoices/123/pdf', 'read:crm'],
  ['OPTIONS', 'contacts', 'read:crm'],
  ['POST', 'contacts', 'write:crm'],
  ['PATCH', 'invoices/123', 'write:crm'],
  ['POST', 'invoices/123/send', 'write:crm'],
  ['POST', 'projects', 'manage:crm'],
  ['POST', 'projects/', 'write:crm'],
  ['DELETE', 'contacts/123', 'manage:crm'],
  ['POST', 'contacts/123/restore', 'manage:crm'],
  ['POST', 'projects/123/close', 'manage:crm'],
  ['GET', 'projects/123/closure-preview', 'manage:crm'],
  ['GET', '/api/crm/projects/123/closure-preview', 'manage:crm'],
  ['POST', 'projects/123/close-and-archive', 'manage:crm'],
  ['POST', 'projects/123/create-follow-up', 'manage:crm'],
  ['GET', 'projects/archive-reconciliation', 'manage:crm'],
  ['POST', 'projects/123/archive-reconciliation', 'manage:crm'],
  ['POST', 'devis/123/convert', 'manage:crm'],
  ['POST', 'contracts', 'manage:crm'],
  ['PATCH', 'contracts/123/sign', 'manage:crm'],
  ['POST', 'services', 'manage:crm'],
  ['PUT', 'settings/company-info', 'manage:crm'],
  ['POST', 'treasury', 'manage:crm'],
] as const

for (const [method, path, expected] of requestCases) {
  test(`${method} ${path} requires ${expected} in the CRM BFF`, () => {
    assert.equal(requiredCrmPermission(method, path), expected)
  })
}

test('reader permission is exact and cannot mutate', () => {
  const reader = ['read:crm']
  assert.equal(canCrmRequest(reader, 'GET', 'contacts'), true)
  assert.equal(canCrmRequest(reader, 'POST', 'contacts'), false)
  assert.equal(canCrmRequest(reader, 'DELETE', 'contacts/123'), false)
})

test('writer permission is exact and cannot manage', () => {
  const writer = ['read:crm', 'write:crm']
  assert.equal(canCrmRequest(writer, 'PATCH', 'contacts/123'), true)
  assert.equal(canCrmRequest(writer, 'DELETE', 'contacts/123'), false)
  assert.equal(canCrmRequest(writer, 'POST', 'projects'), false)
})

test('manager permission does not inherit read or write', () => {
  const manager = ['manage:crm']
  assert.equal(canCrmRequest(manager, 'DELETE', 'contacts/123'), true)
  assert.equal(canCrmRequest(manager, 'GET', 'contacts'), false)
  assert.equal(canCrmRequest(manager, 'POST', 'contacts'), false)
})

test('only a manager can preview or close a project folder', () => {
  const reader = ['read:crm']
  const writer = ['read:crm', 'write:crm']
  const manager = ['manage:crm']

  for (const path of [
    'projects/123/closure-preview',
    'projects/archive-reconciliation',
  ]) {
    assert.equal(canCrmRequest(reader, 'GET', path), false)
    assert.equal(canCrmRequest(writer, 'GET', path), false)
    assert.equal(canCrmRequest(manager, 'GET', path), true)
  }

  for (const path of [
    'projects/123/close-and-archive',
    'projects/123/create-follow-up',
    'projects/123/archive-reconciliation',
  ]) {
    assert.equal(canCrmRequest(writer, 'POST', path), false)
    assert.equal(canCrmRequest(manager, 'POST', path), true)
  }
})
