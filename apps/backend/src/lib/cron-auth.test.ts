import test from 'node:test'
import assert from 'node:assert/strict'
import { isAuthorizedCronRequest } from './cron-auth.js'

test('isAuthorizedCronRequest accepts the exact bearer secret', () => {
  assert.equal(isAuthorizedCronRequest('Bearer secret-value', 'secret-value'), true)
})

test('isAuthorizedCronRequest rejects missing or mismatched secrets', () => {
  assert.equal(isAuthorizedCronRequest('Bearer secret-value', null), false)
  assert.equal(isAuthorizedCronRequest(null, 'secret-value'), false)
  assert.equal(isAuthorizedCronRequest('Bearer other', 'secret-value'), false)
  assert.equal(isAuthorizedCronRequest('secret-value', 'secret-value'), false)
})
