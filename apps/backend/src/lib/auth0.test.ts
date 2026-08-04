import test from 'node:test'
import assert from 'node:assert/strict'
import {
  readerInfoFromVerifiedToken,
  staffInfoFromVerifiedToken,
} from './auth0.js'
import type { VerifiedAuth0Jwt } from './auth0-jwt.js'

function verified(permissions: string[]): VerifiedAuth0Jwt {
  return {
    sub: 'auth0|staff-1',
    permissions,
    payload: {
      sub: 'auth0|staff-1',
      email: 'staff@scoop-afrique.com',
      permissions,
    },
  }
}

test('read:crm creates a staff identity but does not invent write permissions', () => {
  const user = staffInfoFromVerifiedToken(verified(['read:crm']))

  assert.equal(user?.role, 'editor')
  assert.deepEqual(user?.permissions, ['read:crm'])
})

test('article permissions never become CRM permissions', () => {
  const user = staffInfoFromVerifiedToken(
    verified(['publish:articles', 'delete:articles']),
  )

  assert.ok(user)
  assert.deepEqual(user.permissions, ['publish:articles', 'delete:articles'])
  assert.equal(user.permissions.includes('manage:crm'), false)
})

test('a token without any staff permission is not a staff identity', () => {
  assert.equal(staffInfoFromVerifiedToken(verified(['access:reader'])), null)
})

test('access:reader creates a reader identity', () => {
  const reader = readerInfoFromVerifiedToken(verified(['access:reader']))

  assert.equal(reader?.sub, 'auth0|staff-1')
  assert.equal(reader?.email, 'staff@scoop-afrique.com')
})

test('staff-only or permissionless tokens are not reader identities', () => {
  assert.equal(readerInfoFromVerifiedToken(verified(['read:crm'])), null)
  assert.equal(readerInfoFromVerifiedToken(verified([])), null)
})
