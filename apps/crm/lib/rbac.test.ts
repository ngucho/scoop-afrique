import test from 'node:test'
import assert from 'node:assert/strict'
import { crmCapabilities } from './rbac.js'

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
})

test('manage access comes only from manage:crm', () => {
  assert.equal(crmCapabilities(['manage:crm']).canManage, true)
  assert.equal(crmCapabilities(['manage:users']).canManage, false)
  assert.equal(crmCapabilities(['delete:articles']).canManage, false)
})
