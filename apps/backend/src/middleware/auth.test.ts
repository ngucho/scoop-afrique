import test from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import {
  createRequireAuth,
  requirePermission,
} from './auth.js'

test('requireAuth maps invalid tokens to 401', async () => {
  const app = new Hono()
  app.use('*', createRequireAuth({
    resolveUser: async () => ({
      ok: false,
      reason: 'INVALID_TOKEN',
    }),
    isAuth0Configured: () => true,
  }))
  app.get('/', (c) => c.json({ ok: true }))

  const response = await app.request('/', {
    headers: { Authorization: 'Bearer invalid' },
  })

  assert.equal(response.status, 401)
  const body = await response.json() as { code?: string }
  assert.equal(body.code, 'INVALID_TOKEN')
})

test('requireAuth maps JWKS outages to 503', async () => {
  const app = new Hono()
  app.use('*', createRequireAuth({
    resolveUser: async () => ({
      ok: false,
      reason: 'AUTH_PROVIDER_UNAVAILABLE',
    }),
    isAuth0Configured: () => true,
  }))
  app.get('/', (c) => c.json({ ok: true }))

  const response = await app.request('/', {
    headers: { Authorization: 'Bearer signed-token' },
  })

  assert.equal(response.status, 503)
  const body = await response.json() as { code?: string }
  assert.equal(body.code, 'AUTH_PROVIDER_UNAVAILABLE')
})

test('requireAuth reports missing Auth0 configuration without resolving a user', async () => {
  let resolveCalls = 0
  const app = new Hono()
  app.use('*', createRequireAuth({
    resolveUser: async () => {
      resolveCalls += 1
      return { ok: false, reason: 'INVALID_TOKEN' }
    },
    isAuth0Configured: () => false,
  }))
  app.get('/', (c) => c.json({ ok: true }))

  const response = await app.request('/', {
    headers: { Authorization: 'Bearer any-token' },
  })

  assert.equal(response.status, 503)
  const body = await response.json() as { code?: string }
  assert.equal(body.code, 'CONFIG')
  assert.equal(resolveCalls, 0)
})

test('requirePermission rejects a missing permission without using role', async () => {
  const app = new Hono()
  app.use('*', async (c, next) => {
    c.set('user' as never, {
      id: 'profile-1',
      auth0_id: 'auth0|manager',
      email: 'manager@scoop-afrique.com',
      role: 'manager',
      permissions: ['read:crm'],
    } as never)
    await next()
  })
  app.use('*', requirePermission('write:crm'))
  app.post('/', (c) => c.json({ ok: true }))

  const response = await app.request('/', { method: 'POST' })

  assert.equal(response.status, 403)
  const body = await response.json() as { code?: string }
  assert.equal(body.code, 'INSUFFICIENT_PERMISSION')
})
