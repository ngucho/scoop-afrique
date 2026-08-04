import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCrmProxyHeaders } from './crm-proxy-headers.js'

const TOKEN = 'jeton-acces'
const REQUEST_ID = 'req-1'

function build(
  incoming: Record<string, string>,
  method = 'POST',
): Headers {
  return buildCrmProxyHeaders({
    requestHeaders: new Headers(incoming),
    accessToken: TOKEN,
    requestId: REQUEST_ID,
    method,
  })
}

test('the closure idempotency key reaches the backend', () => {
  // Sans cette retransmission, le backend refuse la clôture avec
  // 400 IDEMPOTENCY_KEY_REQUIRED et l'assistant échoue à la confirmation.
  const key = '44444444-4444-4444-8444-444444444444'
  const headers = build({ 'content-type': 'application/json', 'Idempotency-Key': key })

  assert.equal(headers.get('Idempotency-Key'), key)
})

test('the idempotency key is read whatever its casing', () => {
  const key = '55555555-5555-4555-8555-555555555555'
  for (const name of ['Idempotency-Key', 'idempotency-key', 'IDEMPOTENCY-KEY']) {
    const headers = build({ [name]: key })
    assert.equal(headers.get('idempotency-key'), key, `${name} doit être retransmis`)
  }
})

test('an absent idempotency key is not invented', () => {
  const headers = build({ 'content-type': 'application/json' })
  assert.equal(headers.get('Idempotency-Key'), null)
})

test('authorization and request id are always set', () => {
  const headers = build({})
  assert.equal(headers.get('Authorization'), `Bearer ${TOKEN}`)
  assert.equal(headers.get('x-request-id'), REQUEST_ID)
})

test('the browser cookie and session headers are never forwarded', () => {
  // La liste blanche existe pour éviter un HTTP 431 : cookie de session Auth0
  // et jeton Bearer cumulés dépassent la limite d'en-têtes de Node.
  const headers = build({
    cookie: 'appSession=' + 'x'.repeat(4000),
    authorization: 'Bearer jeton-du-navigateur',
    'x-forwarded-for': '203.0.113.7',
    'content-type': 'application/json',
  })

  assert.equal(headers.get('cookie'), null)
  assert.equal(headers.get('x-forwarded-for'), null)
  // Le jeton serveur remplace celui présenté par le navigateur.
  assert.equal(headers.get('Authorization'), `Bearer ${TOKEN}`)
})

test('content-type is omitted on GET and HEAD', () => {
  for (const method of ['GET', 'HEAD']) {
    const headers = build({ 'content-type': 'application/json' }, method)
    assert.equal(headers.get('Content-Type'), null, `${method} ne doit pas porter de Content-Type`)
  }
  assert.equal(
    build({ 'content-type': 'application/json' }, 'POST').get('Content-Type'),
    'application/json',
  )
})

test('accept is forwarded so PDF downloads keep working', () => {
  const headers = build({ accept: 'application/pdf' }, 'GET')
  assert.equal(headers.get('Accept'), 'application/pdf')
})
