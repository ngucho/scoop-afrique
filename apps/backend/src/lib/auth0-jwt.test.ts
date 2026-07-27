import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type KeyLike,
} from 'jose'
import { createAuth0JwtVerifier } from './auth0-jwt.js'

const issuer = 'https://tenant.example.auth0.com/'
const audience = 'https://api.scoop-afrique.test'

async function fixture(kid = 'key-1') {
  const { privateKey, publicKey } = await generateKeyPair('RS256', {
    modulusLength: 2048,
    extractable: true,
  })
  const jwk = await exportJWK(publicKey)
  Object.assign(jwk, { kid, alg: 'RS256', use: 'sig' })
  return { privateKey, jwk }
}

async function sign(
  privateKey: KeyLike,
  kid: string,
  overrides: {
    issuer?: string
    audience?: string
    expirationTime?: number | string
    permissions?: unknown
  } = {},
) {
  return new SignJWT({
    email: 'editor@scoop-afrique.com',
    permissions: overrides.permissions ?? ['read:crm', 'write:crm'],
  })
    .setProtectedHeader({ alg: 'RS256', kid })
    .setSubject('auth0|editor-1')
    .setIssuer(overrides.issuer ?? issuer)
    .setAudience(overrides.audience ?? audience)
    .setIssuedAt()
    .setExpirationTime(overrides.expirationTime ?? '5m')
    .sign(privateKey)
}

test('accepts a correctly signed RS256 Auth0 access token', async () => {
  const { privateKey, jwk } = await fixture()
  const verify = createAuth0JwtVerifier({
    domain: 'tenant.example.auth0.com',
    audience,
    keyResolver: createLocalJWKSet({ keys: [jwk] }),
  })

  const result = await verify(await sign(privateKey, 'key-1'))

  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.token.sub, 'auth0|editor-1')
    assert.deepEqual(result.token.permissions, ['read:crm', 'write:crm'])
  }
})

test('rejects a token signed by an untrusted key', async () => {
  const trusted = await fixture('trusted')
  const attacker = await fixture('attacker')
  const verify = createAuth0JwtVerifier({
    domain: 'tenant.example.auth0.com',
    audience,
    keyResolver: createLocalJWKSet({ keys: [trusted.jwk] }),
  })

  const result = await verify(await sign(attacker.privateKey, 'attacker'))

  assert.deepEqual(result, { ok: false, reason: 'INVALID_TOKEN' })
})

test('rejects a forged signature even when the kid matches', async () => {
  const trusted = await fixture('shared-kid')
  const attacker = await fixture('shared-kid')
  const verify = createAuth0JwtVerifier({
    domain: 'tenant.example.auth0.com',
    audience,
    keyResolver: createLocalJWKSet({ keys: [trusted.jwk] }),
  })

  const result = await verify(
    await sign(attacker.privateKey, 'shared-kid'),
  )

  assert.deepEqual(result, { ok: false, reason: 'INVALID_TOKEN' })
})

test('rejects expired, wrong issuer, and wrong audience tokens', async () => {
  const { privateKey, jwk } = await fixture()
  const verify = createAuth0JwtVerifier({
    domain: 'tenant.example.auth0.com',
    audience,
    keyResolver: createLocalJWKSet({ keys: [jwk] }),
  })
  const now = Math.floor(Date.now() / 1000)

  assert.deepEqual(
    await verify(await sign(privateKey, 'key-1', { expirationTime: now - 60 })),
    { ok: false, reason: 'TOKEN_EXPIRED' },
  )
  assert.deepEqual(
    await verify(await sign(privateKey, 'key-1', {
      issuer: 'https://attacker.example/',
    })),
    { ok: false, reason: 'ISSUER_MISMATCH' },
  )
  assert.deepEqual(
    await verify(await sign(privateKey, 'key-1', {
      audience: 'https://wrong-audience.example',
    })),
    { ok: false, reason: 'AUDIENCE_MISMATCH' },
  )
})

test('treats a malformed permissions claim as no permissions', async () => {
  const { privateKey, jwk } = await fixture()
  const verify = createAuth0JwtVerifier({
    domain: 'tenant.example.auth0.com',
    audience,
    keyResolver: createLocalJWKSet({ keys: [jwk] }),
  })

  const result = await verify(
    await sign(privateKey, 'key-1', { permissions: 'read:crm' }),
  )

  assert.equal(result.ok, true)
  if (result.ok) assert.deepEqual(result.token.permissions, [])
})

test('rejects a signed token without sub', async () => {
  const { privateKey, jwk } = await fixture()
  const verify = createAuth0JwtVerifier({
    domain: 'tenant.example.auth0.com',
    audience,
    keyResolver: createLocalJWKSet({ keys: [jwk] }),
  })
  const token = await new SignJWT({ permissions: ['read:crm'] })
    .setProtectedHeader({ alg: 'RS256', kid: 'key-1' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey)

  assert.deepEqual(await verify(token), {
    ok: false,
    reason: 'MISSING_SUB',
  })
})

test('rejects algorithms other than RS256', async () => {
  const secret = new TextEncoder().encode('a-secret-long-enough-for-hs256')
  const token = await new SignJWT({ permissions: ['read:crm'] })
    .setProtectedHeader({ alg: 'HS256', kid: 'symmetric' })
    .setSubject('auth0|attacker')
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime('5m')
    .sign(secret)
  const verify = createAuth0JwtVerifier({
    domain: 'tenant.example.auth0.com',
    audience,
    keyResolver: async () => secret,
  })

  assert.deepEqual(await verify(token), {
    ok: false,
    reason: 'INVALID_TOKEN',
  })
})

test('accepts a newly rotated signing key after the resolver refreshes', async () => {
  const first = await fixture('key-1')
  const second = await fixture('key-2')
  let local = createLocalJWKSet({ keys: [first.jwk] })
  const verify = createAuth0JwtVerifier({
    domain: 'tenant.example.auth0.com',
    audience,
    keyResolver: (header, token) => local(header, token),
  })

  assert.equal((await verify(await sign(first.privateKey, 'key-1'))).ok, true)
  local = createLocalJWKSet({ keys: [first.jwk, second.jwk] })
  assert.equal((await verify(await sign(second.privateKey, 'key-2'))).ok, true)
})

test('fails closed when the JWKS provider is unavailable', async () => {
  const { privateKey } = await fixture()
  const verify = createAuth0JwtVerifier({
    domain: 'tenant.example.auth0.com',
    audience,
    keyResolver: async () => {
      throw new TypeError('network unavailable')
    },
  })

  assert.deepEqual(await verify(await sign(privateKey, 'key-1')), {
    ok: false,
    reason: 'AUTH_PROVIDER_UNAVAILABLE',
  })
})
