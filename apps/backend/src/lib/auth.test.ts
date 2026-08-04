import test from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import {
  createGetAuthUser,
  getAuthUser,
  getOptionalAuthUser,
} from './auth.js'

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

test('getAuthUser preserves its typed failure result', async () => {
  const app = new Hono()
  app.get('/', async (c) => c.json(await getAuthUser(c)))

  const response = await app.request('/')

  assert.deepEqual(await response.json(), {
    ok: false,
    reason: 'INVALID_TOKEN',
  })
})

test('getOptionalAuthUser safely treats authentication failure as anonymous', async () => {
  const app = new Hono()
  app.get('/', async (c) => {
    const user = await getOptionalAuthUser(c)
    return c.json({ user })
  })

  const response = await app.request('/')

  assert.deepEqual(await response.json(), { user: null })
})
