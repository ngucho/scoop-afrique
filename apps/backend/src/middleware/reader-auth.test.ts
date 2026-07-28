import test from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { createRequireReaderAuth } from './reader-auth.js'

test('does not bootstrap a reader role for an invalid token', async () => {
  let bootstrapCalls = 0
  const middleware = createRequireReaderAuth({
    inspect: async () => ({ ok: false, reason: 'INVALID_TOKEN' }),
    ensureRole: async () => {
      bootstrapCalls += 1
      return 'assigned'
    },
    isAuth0Configured: () => true,
  })
  const app = new Hono()
  app.use('*', middleware)
  app.get('/', (c) => c.json({ ok: true }))

  const response = await app.request('/', {
    headers: { Authorization: 'Bearer forged-token' },
  })

  assert.equal(response.status, 401)
  assert.equal(bootstrapCalls, 0)
})

test('rejects a forged token with malformed permissions without bootstrapping', async () => {
  let bootstrapCalls = 0
  const middleware = createRequireReaderAuth({
    inspect: async () => ({ ok: false, reason: 'INVALID_TOKEN' }),
    ensureRole: async () => {
      bootstrapCalls += 1
      return 'assigned'
    },
    isAuth0Configured: () => true,
  })
  const app = new Hono()
  app.use('*', middleware)
  app.get('/', (c) => c.json({ ok: true }))
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
  ).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ sub: 'auth0|attacker', permissions: 7 }),
  ).toString('base64url')

  const response = await app.request('/', {
    headers: {
      Authorization: `Bearer ${header}.${payload}.forged-signature`,
    },
  })

  assert.equal(response.status, 401)
  const body = await response.json() as { code?: string }
  assert.equal(body.code, 'INVALID_TOKEN')
  assert.equal(bootstrapCalls, 0)
})

test('bootstraps only the sub returned by verified inspection', async () => {
  const received: string[] = []
  const middleware = createRequireReaderAuth({
    inspect: async () => ({
      ok: false,
      reason: 'TOKEN_MISSING_API_PERMISSIONS',
      verifiedSub: 'auth0|verified-reader',
    }),
    ensureRole: async (sub) => {
      received.push(sub)
      return 'assigned'
    },
    isAuth0Configured: () => true,
  })
  const app = new Hono()
  app.use('*', middleware)
  app.get('/', (c) => c.json({ ok: true }))

  const response = await app.request('/', {
    headers: { Authorization: 'Bearer verified-token' },
  })

  assert.equal(response.status, 401)
  assert.deepEqual(received, ['auth0|verified-reader'])
  const body = await response.json() as { code?: string }
  assert.equal(body.code, 'SESSION_REFRESH_NEEDED')
})
