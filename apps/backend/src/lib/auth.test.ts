import test from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { createGetAuthUser } from './auth.js'

test('does not resolve or create a profile after JWT failure', async () => {
  let profileCalls = 0
  const resolveUser = createGetAuthUser({
    verifyToken: async () => ({ ok: false, reason: 'INVALID_TOKEN' }),
    getProfile: async () => {
      profileCalls += 1
      throw new Error('profile resolution must not run')
    },
  })
  const app = new Hono()
  app.get('/', async (c) => c.json(await resolveUser(c)))

  const response = await app.request('/', {
    headers: { Authorization: 'Bearer forged-token' },
  })
  const result = await response.json()

  assert.deepEqual(result, { ok: false, reason: 'INVALID_TOKEN' })
  assert.equal(profileCalls, 0)
})
