# CRM Auth0 Security and Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vérifier cryptographiquement tous les jetons Auth0 du backend et imposer les permissions exactes `read:crm`, `write:crm` et `manage:crm` sur chaque opération CRM.

**Architecture:** Isoler la vérification RS256/JWKS dans un module sans logique métier, puis transformer le JWT vérifié en identité staff ou lecteur dans `auth0.ts`. Propager les permissions vérifiées dans le contexte Hono et appliquer une politique CRM centrale qui classe chaque requête en lecture, écriture courante ou administration, tandis que les routeurs métier restent responsables de la validation des données.

**Tech Stack:** TypeScript 5.7, Node.js test runner, Hono 4.6, `jose` 5.10, Auth0 RBAC, pnpm workspace.

## Global Constraints

- Algorithme JWT accepté : `RS256` uniquement.
- Émetteur attendu : `https://<AUTH0_DOMAIN>/`.
- Audience attendue : `AUTH0_AUDIENCE`.
- Tolérance d’horloge : 30 secondes.
- `read:crm`, `write:crm` et `manage:crm` sont vérifiées exactement, sans héritage implicite.
- Aucun rôle applicatif, rôle en base ou permission éditoriale ne peut autoriser une route CRM.
- Un jeton absent ou invalide produit `401`; une permission absente produit `403`.
- Une configuration Auth0 absente ou un JWKS indisponible sans clé en cache produit `503`.
- Un jeton falsifié ne peut provoquer ni création de profil ni attribution de rôle via Auth0 Management.
- Aucun changement de données, de schéma SQL ou de règle d’archivage dans ce lot.
- Les tests sont écrits et observés en échec avant chaque implémentation de production.

---

## File Map

### Nouveaux fichiers

- `apps/backend/src/lib/auth0-jwt.ts` : vérification cryptographique générique, cache JWKS et normalisation sûre des claims.
- `apps/backend/src/lib/auth0-jwt.test.ts` : jetons RS256 réels, falsification, claims, rotation et indisponibilité JWKS.
- `apps/backend/src/lib/auth0.test.ts` : classification staff/lecteur à partir d’un jeton déjà vérifié.
- `apps/backend/src/lib/auth.test.ts` : garantit qu’un échec JWT ne crée aucun profil et que les permissions vérifiées sont propagées.
- `apps/backend/src/middleware/auth.test.ts` : statuts HTTP de l’authentification et contrôle d’une permission générique.
- `apps/backend/src/middleware/reader-auth.test.ts` : garantit que l’amorçage lecteur exige un `sub` vérifié.
- `apps/backend/src/middleware/crm-authorization.ts` : classification des opérations CRM et garde Hono centrale.
- `apps/backend/src/middleware/crm-authorization.test.ts` : matrice complète lecture/écriture/administration et routes représentatives.

### Fichiers modifiés

- `apps/backend/src/lib/auth0.ts` : retire toute validation fondée sur le simple décodage et applique les règles staff/lecteur au JWT vérifié.
- `apps/backend/src/lib/auth.ts` : renvoie un résultat d’authentification typé et propage `permissions`.
- `apps/backend/src/lib/api-permissions.ts` : expose les constantes et types des permissions CRM.
- `apps/backend/src/middleware/auth.ts` : gère `401`/`503` et fournit `requirePermission`.
- `apps/backend/src/middleware/reader-auth.ts` : attend la vérification cryptographique et utilise uniquement le `verifiedSub`.
- `apps/backend/src/lib/reader-auth.ts` : attend le résultat asynchrone de l’inspection.
- `apps/backend/src/middleware/contributor-auth.ts` : vérifie une seule fois le JWT avant de le classer lecteur ou staff.
- `apps/backend/src/routes/crm/index.ts` : installe `requireAuth` et la politique CRM centrale avant tous les sous-routeurs.
- `apps/backend/src/routes/crm/*.ts` : retire les gardes CRM fondées sur `requireRole`.
- `apps/crm/lib/rbac.ts` : expose des capacités CRM directement calculées depuis les permissions.
- `apps/crm/lib/crm-admin.ts` : remplace les décisions fondées sur le rôle par `manage:crm`.
- `apps/crm/app/(protected)/invoices/[id]/edit/page.tsx` : aligne l’édition financière sur `manage:crm`.
- `apps/crm/app/(protected)/treasury/page.tsx` : aligne l’accès à la trésorerie sur `manage:crm`.
- `docs/AUTH0_SETUP.md` : documente RS256/JWKS, les permissions cumulatives et le renouvellement des sessions.

---

### Task 1: Vérificateur JWT RS256/JWKS

**Files:**

- Create: `apps/backend/src/lib/auth0-jwt.ts`
- Create: `apps/backend/src/lib/auth0-jwt.test.ts`

**Interfaces:**

- Consumes: `config.auth0` depuis `apps/backend/src/config/env.ts`; `jwtVerify`, `createRemoteJWKSet`, `errors` et le type `JWTVerifyGetKey` depuis `jose`.
- Produces:

```ts
export type Auth0JwtFailureReason =
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'ISSUER_MISMATCH'
  | 'AUDIENCE_MISMATCH'
  | 'MISSING_SUB'
  | 'AUTH_PROVIDER_UNAVAILABLE'

export interface VerifiedAuth0Jwt {
  sub: string
  permissions: string[]
  payload: JWTPayload
}

export type Auth0JwtResult =
  | { ok: true; token: VerifiedAuth0Jwt }
  | { ok: false; reason: Auth0JwtFailureReason }

export function createAuth0JwtVerifier(options: {
  domain: string
  audience: string
  keyResolver: JWTVerifyGetKey
}): (accessToken: string) => Promise<Auth0JwtResult>

export function verifyConfiguredAuth0Jwt(
  accessToken: string,
): Promise<Auth0JwtResult>
```

- `verifyConfiguredAuth0Jwt` conserve un vérificateur distant unique créé avec :

```ts
createRemoteJWKSet(
  new URL(`https://${domain}/.well-known/jwks.json`),
  {
    timeoutDuration: 5_000,
    cooldownDuration: 30_000,
    cacheMaxAge: 600_000,
  },
)
```

- [ ] **Step 1: Écrire les tests d’un jeton valide et d’une signature falsifiée**

Créer une paire RSA, exporter la clé publique dans un JWKS local et signer un vrai access token :

```ts
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
```

- [ ] **Step 2: Exécuter ces tests et confirmer l’échec**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend exec node --import tsx --test src/lib/auth0-jwt.test.ts
```

Expected: FAIL avec `Cannot find module './auth0-jwt.js'`.

- [ ] **Step 3: Ajouter les tests des claims et de l’algorithme**

Ajouter dans `auth0-jwt.test.ts` :

```ts
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
```

- [ ] **Step 4: Ajouter les tests de rotation et d’indisponibilité JWKS**

Ajouter :

```ts
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
```

- [ ] **Step 5: Implémenter le vérificateur minimal**

Créer `auth0-jwt.ts` avec cette structure :

```ts
import {
  createRemoteJWKSet,
  errors,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose'
import { config } from '../config/env.js'

export type Auth0JwtFailureReason =
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'ISSUER_MISMATCH'
  | 'AUDIENCE_MISMATCH'
  | 'MISSING_SUB'
  | 'AUTH_PROVIDER_UNAVAILABLE'

export interface VerifiedAuth0Jwt {
  sub: string
  permissions: string[]
  payload: JWTPayload
}

export type Auth0JwtResult =
  | { ok: true; token: VerifiedAuth0Jwt }
  | { ok: false; reason: Auth0JwtFailureReason }

function normalizePermissions(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : []
}

function failureReason(error: unknown): Auth0JwtFailureReason {
  if (error instanceof errors.JWTExpired) return 'TOKEN_EXPIRED'
  if (error instanceof errors.JWTClaimValidationFailed) {
    if (error.claim === 'iss') return 'ISSUER_MISMATCH'
    if (error.claim === 'aud') return 'AUDIENCE_MISMATCH'
  }
  if (
    error instanceof errors.JWKSTimeout ||
    error instanceof errors.JWKSInvalid ||
    error instanceof TypeError
  ) {
    return 'AUTH_PROVIDER_UNAVAILABLE'
  }
  return 'INVALID_TOKEN'
}

export function createAuth0JwtVerifier(options: {
  domain: string
  audience: string
  keyResolver: JWTVerifyGetKey
}) {
  const issuer = `https://${options.domain}/`

  return async (accessToken: string): Promise<Auth0JwtResult> => {
    try {
      const { payload } = await jwtVerify(accessToken, options.keyResolver, {
        issuer,
        audience: options.audience,
        algorithms: ['RS256'],
        clockTolerance: 30,
      })
      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        return { ok: false, reason: 'MISSING_SUB' }
      }
      return {
        ok: true,
        token: {
          sub: payload.sub,
          permissions: normalizePermissions(payload.permissions),
          payload,
        },
      }
    } catch (error) {
      return { ok: false, reason: failureReason(error) }
    }
  }
}

let configuredVerifier:
  | ((accessToken: string) => Promise<Auth0JwtResult>)
  | null = null

export function verifyConfiguredAuth0Jwt(
  accessToken: string,
): Promise<Auth0JwtResult> {
  if (!config.auth0) {
    return Promise.resolve({ ok: false, reason: 'AUTH_PROVIDER_UNAVAILABLE' })
  }
  if (!configuredVerifier) {
    const { domain, audience } = config.auth0
    configuredVerifier = createAuth0JwtVerifier({
      domain,
      audience,
      keyResolver: createRemoteJWKSet(
        new URL(`https://${domain}/.well-known/jwks.json`),
        {
          timeoutDuration: 5_000,
          cooldownDuration: 30_000,
          cacheMaxAge: 600_000,
        },
      ),
    })
  }
  return configuredVerifier(accessToken)
}
```

Après ce squelette, déplacer la résolution d’email depuis `auth0.ts` ou l’appeler après vérification dans Task 2. Ne jamais lire l’email avant que `jwtVerify` ait réussi.

- [ ] **Step 6: Exécuter les tests et corriger uniquement les écarts observés**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend exec node --import tsx --test src/lib/auth0-jwt.test.ts
```

Expected: tous les tests de `auth0-jwt.test.ts` PASS.

- [ ] **Step 7: Vérifier les types**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend run build
```

Expected: build TypeScript PASS.

- [ ] **Step 8: Commit**

```powershell
git add apps/backend/src/lib/auth0-jwt.ts apps/backend/src/lib/auth0-jwt.test.ts
git commit -m "fix(auth): verify Auth0 JWT signatures with JWKS"
```

---

### Task 2: Identité staff vérifiée et erreurs HTTP

**Files:**

- Create: `apps/backend/src/lib/auth0.test.ts`
- Create: `apps/backend/src/lib/auth.test.ts`
- Create: `apps/backend/src/middleware/auth.test.ts`
- Modify: `apps/backend/src/lib/auth0.ts`
- Modify: `apps/backend/src/lib/auth.ts`
- Modify: `apps/backend/src/lib/api-permissions.ts`
- Modify: `apps/backend/src/middleware/auth.ts`

**Interfaces:**

- Consumes: `VerifiedAuth0Jwt`, `Auth0JwtFailureReason` et `verifyConfiguredAuth0Jwt` de Task 1.
- Produces:

```ts
export interface StaffAuth0UserInfo extends Auth0UserInfo {
  permissions: string[]
}

export type StaffAuthResult =
  | { ok: true; user: StaffAuth0UserInfo }
  | {
      ok: false
      reason: Auth0JwtFailureReason | 'TOKEN_MISSING_STAFF_PERMISSION'
    }

export function staffInfoFromVerifiedToken(
  token: VerifiedAuth0Jwt,
): StaffAuth0UserInfo | null

export function verifyAuth0Token(
  accessToken: string,
): Promise<StaffAuthResult>

export interface AuthUser {
  id: string
  auth0_id: string
  email: string
  role: AppRole
  permissions: string[]
}

export type AuthUserResult =
  | { ok: true; user: AuthUser }
  | {
      ok: false
      reason:
        | Auth0JwtFailureReason
        | 'TOKEN_MISSING_STAFF_PERMISSION'
    }

export function createGetAuthUser(dependencies?: {
  verifyToken: typeof verifyAuth0Token
  getProfile: typeof getOrCreateProfile
}): (c: Context) => Promise<AuthUserResult>

export function createRequireAuth(
  dependencies?: {
    resolveUser: (c: Context) => Promise<AuthUserResult>
    isAuth0Configured: () => boolean
  },
): (c: Context, next: Next) => Promise<Response | void>

export function requirePermission(
  ...permissions: string[]
): (c: Context, next: Next) => Promise<Response | void>
```

- [ ] **Step 1: Écrire les tests de classification staff**

Dans `auth0.test.ts`, créer ce helper puis écrire les tests :

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { staffInfoFromVerifiedToken } from './auth0.js'
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
```

- [ ] **Step 2: Écrire le test empêchant la création d’un profil avec un jeton invalide**

Dans `lib/auth.test.ts` :

```ts
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
```

- [ ] **Step 3: Écrire les tests HTTP avant l’implémentation**

Dans `middleware/auth.test.ts`, monter une petite application Hono avec les dépendances injectées :

```ts
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
  assert.equal((await response.json()).code, 'INVALID_TOKEN')
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
  assert.equal((await response.json()).code, 'AUTH_PROVIDER_UNAVAILABLE')
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
  assert.equal((await response.json()).code, 'CONFIG')
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
  assert.equal((await response.json()).code, 'INSUFFICIENT_PERMISSION')
})
```

- [ ] **Step 4: Exécuter les nouveaux tests et confirmer l’échec**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend exec node --import tsx --test src/lib/auth0.test.ts src/lib/auth.test.ts src/middleware/auth.test.ts
```

Expected: FAIL sur les interfaces encore absentes.

- [ ] **Step 5: Refactorer `auth0.ts` autour du jeton vérifié**

Retirer le simple décodage du chemin staff. Les fonctions lecteurs existantes peuvent conserver temporairement leur implémentation actuelle jusqu’à Task 3 afin que Task 2 reste un changement compilable et testable ; aucun déploiement ne doit intervenir entre ces deux tâches. Task 3 supprimera définitivement ce chemin d’autorisation et renommera le décodeur restant `decodeJwtPayloadForDiagnostics`.

Implémenter la classification :

```ts
export function staffInfoFromVerifiedToken(
  token: VerifiedAuth0Jwt,
): StaffAuth0UserInfo | null {
  if (!hasStaffApiAccess(token.permissions)) return null
  return {
    sub: token.sub,
    email: readEmailFromAuth0AccessTokenPayload(
      token.payload as Record<string, unknown>,
      config.auth0?.domain ?? '',
    ),
    role: roleFromPermissions(token.permissions),
    permissions: token.permissions,
  }
}

export async function verifyAuth0Token(
  accessToken: string,
): Promise<StaffAuthResult> {
  const verified = await verifyConfiguredAuth0Jwt(accessToken)
  if (!verified.ok) return verified
  const user = staffInfoFromVerifiedToken(verified.token)
  return user
    ? { ok: true, user }
    : { ok: false, reason: 'TOKEN_MISSING_STAFF_PERMISSION' }
}
```

Les permissions déterminent encore `role` pour compatibilité d’affichage, mais aucune permission CRM supplémentaire n’est ajoutée.

- [ ] **Step 6: Propager les permissions et un résultat typé**

Conserver `Auth0UserInfo` de `profile.service.ts` inchangé et définir `StaffAuth0UserInfo extends Auth0UserInfo` dans `auth0.ts`. Cela permet à `getOrCreateProfile(auth0Result.user)` de consommer uniquement `sub`, `email` et `role`, sans persister `permissions`.

Dans `lib/auth.ts`, remplacer le retour nullable par une fabrique testable :

```ts
export function createGetAuthUser(
  dependencies = {
    verifyToken: verifyAuth0Token,
    getProfile: getOrCreateProfile,
  },
) {
  return async function getAuthUser(
    c: Context,
  ): Promise<AuthUserResult> {
    const token = getBearerToken(c)
    if (!token) return { ok: false, reason: 'INVALID_TOKEN' }

    const auth0Result = await dependencies.verifyToken(token)
    if (!auth0Result.ok) return auth0Result

    const profile = await dependencies.getProfile(auth0Result.user)
    return {
      ok: true,
      user: {
        id: profile.id,
        auth0_id: profile.auth0_id,
        email: profile.email ?? auth0Result.user.email,
        role: auth0Result.user.role,
        permissions: auth0Result.user.permissions,
      },
    }
  }
}

export const getAuthUser = createGetAuthUser()
```

- [ ] **Step 7: Implémenter les middlewares**

Extraire le corps actuel de `requireAuth` vers `createRequireAuth` avec ces dépendances par défaut :

```ts
export function createRequireAuth(
  dependencies = {
    resolveUser: getAuthUser,
    isAuth0Configured: () => config.auth0 !== null,
  },
) {
  return async function requireAuth(c: Context, next: Next) {
    const path = c.req.path
    const token = getBearerToken(c)
    if (!token) {
      logger.authFail(path, 'NO_TOKEN', 'Missing Authorization: Bearer header')
      return c.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, 401)
    }
    if (!dependencies.isAuth0Configured()) {
      return c.json(
        { error: 'Auth0 not configured', code: 'CONFIG' },
        503,
      )
    }
    const result = await dependencies.resolveUser(c)
    if (!result.ok) {
      if (result.reason === 'AUTH_PROVIDER_UNAVAILABLE') {
        logger.authFail(path, 'AUTH_PROVIDER_UNAVAILABLE')
        return c.json(
          {
            error: 'Authentication provider unavailable',
            code: result.reason,
          },
          503,
        )
      }
      logger.authFail(path, 'INVALID_TOKEN', result.reason)
      return c.json({ error: 'Unauthorized', code: 'INVALID_TOKEN' }, 401)
    }

    logger.authOk(path, result.user.email, result.user.role)
    c.set('user' as never, result.user as never)
    await next()
  }
}
```

Exporter :

```ts
export const requireAuth = createRequireAuth()

export function requirePermission(...permissions: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user' as never) as AuthUser | undefined
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    if (!permissions.every((permission) => user.permissions.includes(permission))) {
      logger.authFail(c.req.path, 'INSUFFICIENT_PERMISSION', permissions.join(','))
      return c.json(
        { error: 'Forbidden', code: 'INSUFFICIENT_PERMISSION' },
        403,
      )
    }
    await next()
  }
}
```

Conserver `requireRole` pour les routes éditoriales hors CRM ; ne pas le supprimer globalement.

- [ ] **Step 8: Adapter immédiatement les deux appels contributeur au résultat staff asynchrone**

Dans les fonctions `requireContributorAuth` et `optionalContributorAuth`, remplacer :

```ts
const staff = verifyAuth0Token(token)
if (staff) {
```

par :

```ts
const staffResult = await verifyAuth0Token(token)
if (staffResult.ok) {
```

Ne changer aucune règle lecteur dans cette étape. Ce changement est remplacé par la vérification unique plus propre de Task 3.

- [ ] **Step 9: Exécuter les tests ciblés**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend exec node --import tsx --test src/lib/auth0-jwt.test.ts src/lib/auth0.test.ts src/lib/auth.test.ts src/middleware/auth.test.ts
```

Expected: PASS.

- [ ] **Step 10: Exécuter le build**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend run build
```

Expected: PASS. Task 2 ne doit pas être committée si le build ne réussit pas.

- [ ] **Step 11: Commit**

```powershell
git add apps/backend/src/lib/auth0.ts apps/backend/src/lib/auth0.test.ts apps/backend/src/lib/auth.ts apps/backend/src/lib/auth.test.ts apps/backend/src/lib/api-permissions.ts apps/backend/src/middleware/auth.ts apps/backend/src/middleware/auth.test.ts apps/backend/src/middleware/contributor-auth.ts
git commit -m "fix(auth): propagate verified JWT permissions"
```

---

### Task 3: Parcours lecteur et contributeur sécurisé

**Files:**

- Create: `apps/backend/src/middleware/reader-auth.test.ts`
- Modify: `apps/backend/src/lib/auth0.ts`
- Modify: `apps/backend/src/middleware/reader-auth.ts`
- Modify: `apps/backend/src/lib/reader-auth.ts`
- Modify: `apps/backend/src/middleware/contributor-auth.ts`

**Interfaces:**

- Consumes: `verifyConfiguredAuth0Jwt` et `VerifiedAuth0Jwt` de Task 1.
- Produces:

```ts
export function readerInfoFromVerifiedToken(
  token: VerifiedAuth0Jwt,
): ReaderAuth0TokenInfo | null

export type ReaderRouteAuthResult =
  | { ok: true; user: ReaderAuth0TokenInfo }
  | {
      ok: false
      reason: Auth0JwtFailureReason | 'TOKEN_MISSING_API_PERMISSIONS'
      verifiedSub?: string
    }

export async function inspectTokenForReaderRoutes(
  accessToken: string,
): Promise<ReaderRouteAuthResult>

export function createRequireReaderAuth(dependencies?: {
  inspect: typeof inspectTokenForReaderRoutes
  ensureRole: typeof ensureReaderRoleViaManagement
  isAuth0Configured: () => boolean
}): (c: Context, next: Next) => Promise<Response | void>
```

- [ ] **Step 1: Écrire le test empêchant l’amorçage depuis un jeton non vérifié**

Dans `auth0.test.ts`, ajouter `readerInfoFromVerifiedToken` à l’import existant depuis `./auth0.js`, puis ajouter la classification lecteur :

```ts
test('access:reader creates a reader identity', () => {
  const reader = readerInfoFromVerifiedToken(verified(['access:reader']))

  assert.equal(reader?.sub, 'auth0|staff-1')
  assert.equal(reader?.email, 'staff@scoop-afrique.com')
})

test('staff-only or permissionless tokens are not reader identities', () => {
  assert.equal(readerInfoFromVerifiedToken(verified(['read:crm'])), null)
  assert.equal(readerInfoFromVerifiedToken(verified([])), null)
})
```

Dans `reader-auth.test.ts`, ajouter :

```ts
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
  assert.equal((await response.json()).code, 'SESSION_REFRESH_NEEDED')
})
```

- [ ] **Step 2: Exécuter le test et confirmer l’échec**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend exec node --import tsx --test src/middleware/reader-auth.test.ts
```

Expected: FAIL car `createRequireReaderAuth` et `verifiedSub` n’existent pas.

- [ ] **Step 3: Classer les jetons lecteurs après vérification**

Dans `auth0.ts`, implémenter :

```ts
export function readerInfoFromVerifiedToken(
  token: VerifiedAuth0Jwt,
): ReaderAuth0TokenInfo | null {
  if (!hasReaderAccountPermission(token.permissions)) return null
  return {
    sub: token.sub,
    email: readEmailFromAuth0AccessTokenPayload(
      token.payload as Record<string, unknown>,
      config.auth0?.domain ?? '',
    ),
  }
}

export async function inspectTokenForReaderRoutes(
  accessToken: string,
): Promise<ReaderRouteAuthResult> {
  const verified = await verifyConfiguredAuth0Jwt(accessToken)
  if (!verified.ok) return verified

  const email = readEmailFromAuth0AccessTokenPayload(
    verified.token.payload as Record<string, unknown>,
    config.auth0?.domain ?? '',
  )
  if (
    hasReaderAccountPermission(verified.token.permissions) ||
    hasStaffApiAccess(verified.token.permissions)
  ) {
    return {
      ok: true,
      user: { sub: verified.token.sub, email },
    }
  }
  return {
    ok: false,
    reason: 'TOKEN_MISSING_API_PERMISSIONS',
    verifiedSub: verified.token.sub,
  }
}
```

Supprimer `readAccessTokenSub`. Aucun appel Auth0 Management ne doit dépendre du décodeur de diagnostic.

- [ ] **Step 4: Injecter les dépendances du middleware lecteur**

Remplacer d’abord `readerUnauthorized` afin d’uniformiser les codes sans exposer les détails en production :

```ts
function readerUnauthorized(
  c: Context,
  reason: string | undefined,
  devHint: string | undefined,
  status: 401 | 503 = 401,
) {
  if (status === 503) {
    return c.json(
      {
        error: 'Authentication provider unavailable',
        code: 'CONFIG',
        ...(config.nodeEnv !== 'production' && {
          hint: 'Set AUTH0_DOMAIN and AUTH0_AUDIENCE',
        }),
      },
      503,
    )
  }
  return c.json(
    {
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
      ...(config.nodeEnv !== 'production' && { reason, hint: devHint }),
    },
    401,
  )
}
```

Transformer ensuite le middleware actuel :

```ts
export function createRequireReaderAuth(
  dependencies = {
    inspect: inspectTokenForReaderRoutes,
    ensureRole: ensureReaderRoleViaManagement,
    isAuth0Configured: () => config.auth0 !== null,
  },
) {
  return async function requireReaderAuth(c: Context, next: Next) {
    const path = c.req.path
    const token = getBearerToken(c)

    if (!token) {
      logger.authFail(path, 'NO_TOKEN', 'Missing Authorization: Bearer header')
      if (config.nodeEnv === 'production') {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      return c.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, 401)
    }
    if (!dependencies.isAuth0Configured()) {
      return readerUnauthorized(c, undefined, undefined, 503)
    }

    const auth = await dependencies.inspect(token)
    if (auth.ok) {
      c.set('reader' as never, auth.user as never)
      await next()
      return
    }

    const tokenInfo = summarizeAccessTokenForLogs(token)
    logger.authFail(path, 'INVALID_READER_TOKEN', undefined, {
      reason: auth.reason,
      decode_ok: tokenInfo.decode_ok,
      token_summary: tokenInfo.summary,
    })

    if (auth.reason === 'AUTH_PROVIDER_UNAVAILABLE') {
      return c.json(
        {
          error: 'Authentication provider unavailable',
          code: 'AUTH_PROVIDER_UNAVAILABLE',
        },
        503,
      )
    }

    if (
      auth.reason === 'TOKEN_MISSING_API_PERMISSIONS' &&
      auth.verifiedSub
    ) {
      const bootstrap = await dependencies.ensureRole(auth.verifiedSub)
      if (bootstrap === 'assigned' || bootstrap === 'already_had_reader') {
        return sessionRefreshResponse(c)
      }
    }

    const devHint =
      auth.reason === 'TOKEN_MISSING_API_PERMISSIONS'
        ? 'Jeton sans permission API — vérifier RBAC Auth0 et renouveler la session.'
        : auth.reason === 'AUDIENCE_MISMATCH'
          ? 'Vérifier AUTH0_AUDIENCE côté backend et côté client reader.'
          : undefined

    return readerUnauthorized(c, auth.reason, devHint, 401)
  }
}

export const requireReaderAuth = createRequireReaderAuth()
```

Mapper `AUTH_PROVIDER_UNAVAILABLE` vers `503` et les autres échecs vers `401`.

- [ ] **Step 5: Mettre à jour les autres appels asynchrones**

Dans `lib/reader-auth.ts` :

```ts
const result = await inspectTokenForReaderRoutes(token)
return result.ok ? result.user : null
```

Dans `contributor-auth.ts`, appeler `verifyConfiguredAuth0Jwt(token)` une seule fois :

```ts
const verified = await verifyConfiguredAuth0Jwt(token)
if (!verified.ok) {
  if (verified.reason === 'AUTH_PROVIDER_UNAVAILABLE') {
    return c.json(
      { error: 'Authentication provider unavailable', code: verified.reason },
      503,
    )
  }
  return c.json({ error: 'Unauthorized', code: 'INVALID_TOKEN' }, 401)
}

const reader = readerInfoFromVerifiedToken(verified.token)
if (reader) {
  const profile = await getOrCreateProfile({
    sub: reader.sub,
    email: reader.email,
    role: 'journalist',
  })
  c.set('contributor' as never, {
    profileId: profile.id,
    auth0Sub: reader.sub,
    email: reader.email,
    isReader: true,
  } satisfies ContributorContext as never)
  await next()
  return
}

const staff = staffInfoFromVerifiedToken(verified.token)
if (staff) {
  return c.json(
    {
      error:
        'La Tribune nécessite un compte lecteur (permission access:reader, sans accès rédaction seul). Utilisez votre compte abonné ou le backoffice.',
      code: 'TRIBUNE_READER_TOKEN_REQUIRED',
    },
    403,
  )
}

logger.authFail(
  path,
  'INVALID_TOKEN',
  'Contributor auth requires a valid reader token',
)
return c.json({ error: 'Unauthorized', code: 'INVALID_TOKEN' }, 401)
```

Remplacer le cœur de `optionalContributorAuth` par :

```ts
const verified = await verifyConfiguredAuth0Jwt(token)
if (!verified.ok) {
  await next()
  return
}

const reader = readerInfoFromVerifiedToken(verified.token)
if (reader) {
  const profile = await getOrCreateProfile({
    sub: reader.sub,
    email: reader.email,
    role: 'journalist',
  })
  c.set('contributor' as never, {
    profileId: profile.id,
    auth0Sub: reader.sub,
    email: reader.email,
    isReader: true,
  } satisfies ContributorContext as never)
}

await next()
```

- [ ] **Step 6: Exécuter les tests lecteurs et JWT**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend exec node --import tsx --test src/lib/auth0-jwt.test.ts src/lib/auth0.test.ts src/middleware/auth.test.ts src/middleware/reader-auth.test.ts
```

Expected: PASS.

- [ ] **Step 7: Exécuter le build backend**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend run build
```

Expected: PASS sans appel synchrone restant vers les fonctions Auth0.

- [ ] **Step 8: Commit**

```powershell
git add apps/backend/src/lib/auth0.ts apps/backend/src/middleware/reader-auth.ts apps/backend/src/middleware/reader-auth.test.ts apps/backend/src/lib/reader-auth.ts apps/backend/src/middleware/contributor-auth.ts
git commit -m "fix(auth): secure reader and contributor token flows"
```

---

### Task 4: Politique centrale des permissions CRM

**Files:**

- Create: `apps/backend/src/middleware/crm-authorization.ts`
- Create: `apps/backend/src/middleware/crm-authorization.test.ts`
- Modify: `apps/backend/src/lib/api-permissions.ts`
- Modify: `apps/backend/src/routes/crm/index.ts`
- Modify: `apps/backend/src/routes/crm/activity.ts`
- Modify: `apps/backend/src/routes/crm/contacts.ts`
- Modify: `apps/backend/src/routes/crm/contracts.ts`
- Modify: `apps/backend/src/routes/crm/dashboard.ts`
- Modify: `apps/backend/src/routes/crm/deliverables.ts`
- Modify: `apps/backend/src/routes/crm/devis-requests.ts`
- Modify: `apps/backend/src/routes/crm/devis.ts`
- Modify: `apps/backend/src/routes/crm/invoices.ts`
- Modify: `apps/backend/src/routes/crm/organizations.ts`
- Modify: `apps/backend/src/routes/crm/payments.ts`
- Modify: `apps/backend/src/routes/crm/projects.ts`
- Modify: `apps/backend/src/routes/crm/reminders.ts`
- Modify: `apps/backend/src/routes/crm/reports.ts`
- Modify: `apps/backend/src/routes/crm/services.ts`
- Modify: `apps/backend/src/routes/crm/settings.ts`
- Modify: `apps/backend/src/routes/crm/tasks.ts`
- Modify: `apps/backend/src/routes/crm/treasury.ts`

**Interfaces:**

- Consumes: `requireAuth`, `requirePermission` et `AuthUser` de Task 2.
- Produces:

```ts
export const CRM_PERMISSIONS = {
  read: 'read:crm',
  write: 'write:crm',
  manage: 'manage:crm',
} as const

export type CrmPermission =
  (typeof CRM_PERMISSIONS)[keyof typeof CRM_PERMISSIONS]

export function requiredCrmPermission(
  method: string,
  requestPath: string,
  apiPrefix?: string,
): CrmPermission

export function requireCrmPermission(
  c: Context,
  next: Next,
): Promise<Response | void>
```

- [ ] **Step 1: Écrire la matrice de classification avant le middleware**

Dans `crm-authorization.test.ts` :

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import {
  requireCrmPermission,
  requiredCrmPermission,
} from './crm-authorization.js'
import type { CrmPermission } from '../lib/api-permissions.js'

const cases: Array<[string, string, CrmPermission]> = [
  ['GET', '/api/v1/crm/contacts', 'read:crm'],
  ['GET', '/api/v1/crm/invoices/123/pdf', 'read:crm'],
  ['POST', '/api/v1/crm/contacts', 'write:crm'],
  ['PATCH', '/api/v1/crm/invoices/123', 'write:crm'],
  ['POST', '/api/v1/crm/invoices/123/send', 'write:crm'],
  ['POST', '/api/v1/crm/projects', 'manage:crm'],
  ['DELETE', '/api/v1/crm/contacts/123', 'manage:crm'],
  ['POST', '/api/v1/crm/contacts/123/restore', 'manage:crm'],
  ['POST', '/api/v1/crm/projects/123/close', 'manage:crm'],
  ['POST', '/api/v1/crm/devis/123/convert', 'manage:crm'],
  ['POST', '/api/v1/crm/contracts', 'manage:crm'],
  ['PATCH', '/api/v1/crm/contracts/123/sign', 'manage:crm'],
  ['POST', '/api/v1/crm/services', 'manage:crm'],
  ['PATCH', '/api/v1/crm/services/123', 'manage:crm'],
  ['PUT', '/api/v1/crm/settings/company-info', 'manage:crm'],
  ['POST', '/api/v1/crm/settings/reminder-rules', 'manage:crm'],
  ['POST', '/api/v1/crm/treasury', 'manage:crm'],
  ['PATCH', '/api/v1/crm/treasury/123', 'manage:crm'],
]

for (const [method, path, expected] of cases) {
  test(`${method} ${path} requires ${expected}`, () => {
    assert.equal(requiredCrmPermission(method, path), expected)
  })
}
```

- [ ] **Step 2: Écrire les tests de la matrice utilisateur**

Ajouter une application de test qui injecte successivement les permissions :

```ts
async function requestWith(
  permissions: string[],
  method: string,
  path: string,
) {
  const crm = new Hono()
  crm.use('*', async (c, next) => {
    c.set('user' as never, {
      id: 'profile-1',
      auth0_id: 'auth0|user',
      email: 'user@scoop-afrique.com',
      role: 'admin',
      permissions,
    } as never)
    await next()
  })
  crm.use('*', requireCrmPermission)
  crm.all('*', (c) => c.json({ ok: true }))

  const root = new Hono()
  root.route('/api/v1/crm', crm)
  return root.request(path, { method })
}

test('read-only CRM permission cannot mutate', async () => {
  assert.equal(
    (await requestWith(['read:crm'], 'GET', '/api/v1/crm/contacts')).status,
    200,
  )
  assert.equal(
    (await requestWith(['read:crm'], 'POST', '/api/v1/crm/contacts')).status,
    403,
  )
})

test('write permission cannot administer CRM', async () => {
  const permissions = ['read:crm', 'write:crm']
  assert.equal(
    (await requestWith(permissions, 'PATCH', '/api/v1/crm/contacts/1')).status,
    200,
  )
  assert.equal(
    (await requestWith(permissions, 'DELETE', '/api/v1/crm/contacts/1')).status,
    403,
  )
  assert.equal(
    (await requestWith(
      permissions,
      'PUT',
      '/api/v1/crm/settings/company-info',
    )).status,
    403,
  )
})

test('cumulative manage permissions can administer CRM', async () => {
  const permissions = ['read:crm', 'write:crm', 'manage:crm']
  assert.equal(
    (await requestWith(
      permissions,
      'POST',
      '/api/v1/crm/projects/1/restore',
    )).status,
    200,
  )
  assert.equal(
    (await requestWith(permissions, 'POST', '/api/v1/crm/treasury')).status,
    200,
  )
})

test('manage permission does not implicitly grant read or write', async () => {
  assert.equal(
    (await requestWith(
      ['manage:crm'],
      'GET',
      '/api/v1/crm/contacts',
    )).status,
    403,
  )
  assert.equal(
    (await requestWith(
      ['manage:crm'],
      'POST',
      '/api/v1/crm/contacts',
    )).status,
    403,
  )
  assert.equal(
    (await requestWith(
      ['manage:crm'],
      'DELETE',
      '/api/v1/crm/contacts/1',
    )).status,
    200,
  )
})
```

- [ ] **Step 3: Exécuter les tests et confirmer l’échec**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend exec node --import tsx --test src/middleware/crm-authorization.test.ts
```

Expected: FAIL car le module de politique n’existe pas.

- [ ] **Step 4: Implémenter la classification pure**

Dans `api-permissions.ts`, ajouter les constantes et le type `CrmPermission`.

Dans `crm-authorization.ts`, normaliser le chemin puis appliquer les règles dans cet ordre :

```ts
function relativeCrmPath(requestPath: string, apiPrefix: string): string {
  const root = `${apiPrefix.replace(/\/+$/, '')}/crm`
  if (!requestPath.startsWith(root)) return requestPath
  return requestPath.slice(root.length) || '/'
}

const restorePattern =
  /^\/(?:contacts|devis|projects|invoices|contracts)\/[^/]+\/restore$/
const projectClosePattern = /^\/projects\/[^/]+\/close$/
const devisConvertPattern = /^\/devis\/[^/]+\/convert$/
const contractSignPattern = /^\/contracts\/[^/]+\/sign$/

export function requiredCrmPermission(
  method: string,
  requestPath: string,
  apiPrefix = '/api/v1',
): CrmPermission {
  const verb = method.toUpperCase()
  const path = relativeCrmPath(requestPath, apiPrefix)

  if (verb === 'GET' || verb === 'HEAD' || verb === 'OPTIONS') {
    return CRM_PERMISSIONS.read
  }
  if (verb === 'DELETE') return CRM_PERMISSIONS.manage
  if (
    path.startsWith('/settings') ||
    path.startsWith('/treasury') ||
    path.startsWith('/services')
  ) {
    return CRM_PERMISSIONS.manage
  }
  if (verb === 'POST' && (path === '/projects' || path === '/contracts')) {
    return CRM_PERMISSIONS.manage
  }
  if (
    restorePattern.test(path) ||
    projectClosePattern.test(path) ||
    devisConvertPattern.test(path) ||
    contractSignPattern.test(path)
  ) {
    return CRM_PERMISSIONS.manage
  }
  return CRM_PERMISSIONS.write
}
```

Cette fonction ne doit consulter ni rôle, ni base de données, ni contenu de requête.

- [ ] **Step 5: Implémenter le middleware central**

```ts
export async function requireCrmPermission(c: Context, next: Next) {
  const permission = requiredCrmPermission(
    c.req.method,
    c.req.path,
    config.apiPrefix,
  )
  return requirePermission(permission)(c, next)
}
```

- [ ] **Step 6: Installer les deux gardes au niveau du routeur CRM**

Dans `routes/crm/index.ts`, juste après `const app = new Hono()` et avant les `app.route` :

```ts
app.use('*', requireAuth)
app.use('*', requireCrmPermission)
```

Importer les deux middlewares :

```ts
import { requireAuth } from '../../middleware/auth.js'
import { requireCrmPermission } from '../../middleware/crm-authorization.js'
```

- [ ] **Step 7: Retirer toutes les gardes basées sur les rôles dans les sous-routeurs**

Appliquer exactement ces changements mécaniques :

- dans les 17 fichiers de routes listés dans **Files**, supprimer `app.use('*', requireAuth, requireRole(...))` ;
- retirer `requireAuth` et `requireRole` de leurs imports lorsqu’ils ne servent plus ;
- retirer les arguments inline `requireRole(...)` des routes suivantes sans modifier leurs handlers :

```text
contacts.ts: DELETE /:id, POST /:id/restore
contracts.ts: POST /, DELETE /:id, POST /:id/restore, PATCH /:id/sign
devis-requests.ts: DELETE /:id
devis.ts: DELETE /:id, POST /:id/restore, POST /:id/convert
invoices.ts: DELETE /:id, POST /:id/restore
projects.ts: POST /, DELETE /:id, POST /:id/restore, POST /:id/close
services.ts: POST /, PATCH /:id, DELETE /:id
tasks.ts: DELETE /:id
```

Exemple exact :

```ts
// avant
app.post('/', requireRole('manager', 'admin'), async (c) => {

// après
app.post('/', async (c) => {
```

Dans `contracts.ts`, `devis.ts`, `invoices.ts` et `projects.ts`, remplacer aussi tous les contrôles d’accès internes fondés sur `user.role` :

```ts
const canManageCrm = user.permissions.includes('manage:crm')
```

Appliquer `canManageCrm` aux emplacements exacts suivants :

```text
contracts.ts: demande archived=true et lecture d’un contrat archivé
devis.ts: demande archived=true et lecture d’un devis archivé
invoices.ts: demande archived=true du résumé et de la liste,
             lecture d’une facture archivée,
             modification financière d’une facture ayant des paiements
projects.ts: demande archived=true, lecture d’un projet archivé,
             lecture du dossier d’un projet archivé
```

Exemples exacts :

```ts
// avant
archivedQuery === 'true'
  ? user.role === 'admin'
    ? true
    : undefined

// après
archivedQuery === 'true'
  ? canManageCrm
    ? true
    : undefined
```

```ts
// avant
if (isArchived && user.role !== 'admin') {

// après
if (isArchived && !canManageCrm) {
```

```ts
// avant
const privileged = user.role === 'manager' || user.role === 'admin'

// après
const privileged = canManageCrm
```

Renommer les commentaires `Admin archive` et `Admin restore` en `CRM management archive` et `CRM management restore`. La politique centrale remplace toutes les gardes par rôle ; aucune route CRM ne doit conserver `requireRole` ou consulter `user.role`.

- [ ] **Step 8: Exécuter les tests de politique**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend exec node --import tsx --test src/middleware/crm-authorization.test.ts
```

Expected: PASS.

- [ ] **Step 9: Vérifier structurellement l’absence de garde par rôle**

Run:

```powershell
Get-ChildItem -LiteralPath 'apps/backend/src/routes/crm' -File -Filter '*.ts' |
  Select-String -Pattern 'requireRole|app\.use.+requireAuth|user\.role'
```

Expected: aucune sortie.

- [ ] **Step 10: Exécuter la suite backend et le build**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend run test
corepack pnpm --filter @scoop-afrique/backend run build
```

Expected: tous les tests PASS et build PASS.

- [ ] **Step 11: Commit**

```powershell
git add apps/backend/src/lib/api-permissions.ts apps/backend/src/middleware/crm-authorization.ts apps/backend/src/middleware/crm-authorization.test.ts apps/backend/src/routes/crm
git commit -m "fix(crm): enforce exact permissions on every route"
```

---

### Task 5: Alignement des capacités affichées dans le CRM

**Files:**

- Create: `apps/crm/lib/rbac.test.ts`
- Modify: `apps/crm/lib/rbac.ts`
- Modify: `apps/crm/lib/crm-admin.ts`
- Modify: `apps/crm/app/(protected)/invoices/[id]/edit/page.tsx`
- Modify: `apps/crm/app/(protected)/treasury/page.tsx`

**Interfaces:**

- Consumes: le tableau `permissions` déjà fourni par `apps/crm/lib/auth0.ts`.
- Produces:

```ts
export interface CrmCapabilities {
  canRead: boolean
  canWrite: boolean
  canManage: boolean
}

export function crmCapabilities(
  permissions: string[],
): CrmCapabilities

export function getCrmCanManage(): Promise<boolean>
```

- [ ] **Step 1: Écrire les tests de capacités avant l’implémentation**

Créer `apps/crm/lib/rbac.test.ts` :

```ts
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
```

- [ ] **Step 2: Exécuter le test et confirmer l’échec**

Run depuis la racine du dépôt en utilisant le chargeur TypeScript déjà déclaré par le backend :

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test ../crm/lib/rbac.test.ts
```

Expected: FAIL car `crmCapabilities` n’est pas exporté.

- [ ] **Step 3: Implémenter les capacités exactes**

Ajouter dans `apps/crm/lib/rbac.ts` :

```ts
export interface CrmCapabilities {
  canRead: boolean
  canWrite: boolean
  canManage: boolean
}

export function crmCapabilities(
  permissions: string[],
): CrmCapabilities {
  return {
    canRead: hasReadCrm(permissions),
    canWrite: hasWriteCrm(permissions),
    canManage: hasManageCrm(permissions),
  }
}
```

- [ ] **Step 4: Remplacer les contrôles serveur fondés sur les rôles**

Dans `apps/crm/lib/crm-admin.ts`, ajouter :

```ts
export async function getCrmCanManage(): Promise<boolean> {
  const tokenResult = await getAccessToken()
  const permissions = tokenResult?.permissions ?? []
  return crmCapabilities(permissions).canManage
}
```

Conserver temporairement `getCrmIsAdmin` pour éviter une modification mécanique de toutes les pages d’archives, mais remplacer son implémentation par :

```ts
/**
 * Nom historique utilisé par les pages d’archives.
 * La capacité réelle est manage:crm, pas un rôle admin.
 */
export async function getCrmIsAdmin(): Promise<boolean> {
  return getCrmCanManage()
}
```

`getCrmRole` peut rester exporté pour l’affichage, mais ne doit plus être appelé pour une décision d’accès.

- [ ] **Step 5: Aligner les deux pages qui utilisent encore `getCrmRole`**

Dans `invoices/[id]/edit/page.tsx` :

```ts
import { getCrmCanManage } from '@/lib/crm-admin'

const canManageCrm = await getCrmCanManage()
const amountPaid = Number(invoice.amount_paid ?? 0)
const invStatus = String(invoice.status ?? '')
const hasPayment =
  amountPaid > 0 || invStatus === 'paid' || invStatus === 'partial'
const canEditFinancialLines = !hasPayment || canManageCrm
```

Dans `treasury/page.tsx` :

```ts
import { getCrmCanManage } from '@/lib/crm-admin'

const canManageCrm = await getCrmCanManage()
if (!canManageCrm) {
  redirect('/dashboard')
}
```

- [ ] **Step 6: Exécuter le test de capacités**

Run :

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test ../crm/lib/rbac.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 7: Vérifier qu’aucune page ne décide avec `getCrmRole`**

Run :

```powershell
Get-ChildItem -LiteralPath 'apps/crm/app' -Recurse -File -Include *.ts,*.tsx |
  Select-String -Pattern 'getCrmRole|role === .manager.|role === .admin.|role !== .manager.'
```

Expected: aucune sortie.

- [ ] **Step 8: Construire le CRM**

Run :

```powershell
corepack pnpm --filter @scoop-afrique/crm run build
```

Expected: build Next.js PASS.

- [ ] **Step 9: Commit**

```powershell
git add -- 'apps/crm/lib/rbac.ts' 'apps/crm/lib/rbac.test.ts' 'apps/crm/lib/crm-admin.ts' 'apps/crm/app/(protected)/invoices/[id]/edit/page.tsx' 'apps/crm/app/(protected)/treasury/page.tsx'
git commit -m "fix(crm): align UI capabilities with Auth0 permissions"
```

---

### Task 6: Documentation et vérification finale

**Files:**

- Modify: `docs/AUTH0_SETUP.md`
- Verify: tous les fichiers modifiés dans Tasks 1–5

**Interfaces:**

- Consumes: comportements et types livrés par Tasks 1–5.
- Produces: guide de configuration aligné avec le code et preuves de vérification reproductibles.

- [ ] **Step 1: Mettre à jour la documentation Auth0**

Dans la section backend de `AUTH0_SETUP.md`, remplacer toute formulation « validation locale par décodage » par :

```markdown
Le backend vérifie chaque access token avec `jose` :

- signature RS256 contre `https://<AUTH0_DOMAIN>/.well-known/jwks.json` ;
- `iss` égal à `https://<AUTH0_DOMAIN>/` ;
- `aud` égal à `AUTH0_AUDIENCE` ;
- expiration avec une tolérance d’horloge de 30 secondes.

Le cache JWKS prend en charge la rotation des clés. Si aucune clé valide n’est
disponible et que le JWKS Auth0 est inaccessible, le backend refuse l’accès
avec `503 AUTH_PROVIDER_UNAVAILABLE`.
```

Ajouter le tableau CRM :

```markdown
| Rôle Auth0 | Permissions CRM requises |
|---|---|
| Lecteur CRM | `read:crm` |
| Éditeur CRM | `read:crm`, `write:crm` |
| Manager/Admin CRM | `read:crm`, `write:crm`, `manage:crm` |

Les permissions sont cumulatives mais vérifiées exactement par le backend.
Après toute modification de rôle ou permission Auth0, l’utilisateur doit
renouveler sa session pour recevoir un nouveau jeton.
```

- [ ] **Step 2: Vérifier qu’aucun chemin d’autorisation ne fait confiance au décodage**

Run:

```powershell
Get-ChildItem -LiteralPath 'apps/backend/src' -Recurse -File -Include *.ts |
  Select-String -Pattern 'decodeJwtPayload|readAccessTokenSub'
```

Expected: uniquement la fonction explicitement nommée `decodeJwtPayloadForDiagnostics` et son appel depuis `summarizeAccessTokenForLogs`; aucune occurrence de `readAccessTokenSub`.

- [ ] **Step 3: Exécuter toute la suite backend**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend run test
```

Expected: les 20 tests historiques et tous les nouveaux tests passent.

- [ ] **Step 4: Exécuter build et lint**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend run build
corepack pnpm --filter @scoop-afrique/backend run lint
corepack pnpm --filter @scoop-afrique/crm run build
corepack pnpm --filter @scoop-afrique/crm exec eslint 'lib/rbac.ts' 'lib/rbac.test.ts' 'lib/crm-admin.ts' 'app/(protected)/invoices/[id]/edit/page.tsx' 'app/(protected)/treasury/page.tsx'
```

Expected:

- builds backend et CRM PASS ;
- aucune erreur de lint dans les fichiers modifiés ;
- aucun nouvel avertissement dans les fichiers modifiés.

- [ ] **Step 5: Vérifier la matrice d’accès représentative**

Run:

```powershell
corepack pnpm --filter @scoop-afrique/backend exec node --import tsx --test src/middleware/crm-authorization.test.ts src/middleware/auth.test.ts src/middleware/reader-auth.test.ts
```

Expected:

- lecture seule : GET `200`, POST/DELETE `403` ;
- écriture : GET/PATCH `200`, archive/configuration/trésorerie `403` ;
- administration cumulative : opérations sensibles `200` ;
- jeton invalide : `401` ;
- JWKS indisponible : `503` ;
- aucun amorçage lecteur depuis un jeton non vérifié.

- [ ] **Step 6: Inspecter les changements avant livraison**

Run:

```powershell
git diff --check
git diff --stat
git status --short
```

Expected:

- `git diff --check` sans sortie ;
- aucun fichier de données ou migration SQL modifié ;
- les documents d’audit, de design et de plan restent distincts des changements de production.

- [ ] **Step 7: Commit**

```powershell
git add docs/AUTH0_SETUP.md
git commit -m "docs(auth): document CRM JWT and permission policy"
```

- [ ] **Step 8: Préparer la validation Auth0 avant déploiement**

Vérifier dans le tableau de bord Auth0, sans changer les utilisateurs depuis le code :

```text
API Signing Algorithm: RS256
Enable RBAC: On
Add Permissions in the Access Token: On
editor: read:crm + write:crm
manager/admin: read:crm + write:crm + manage:crm
```

Ne pas déployer tant que cette vérification externe n’est pas confirmée. Aucun fallback vers les anciens rôles ne doit être ajouté.
