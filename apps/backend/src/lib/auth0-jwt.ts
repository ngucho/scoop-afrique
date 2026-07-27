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
