/**
 * Auth0 Management API client.
 *
 * Used to update user_metadata (name, address, phone, sex)
 * and to change password for database users.
 *
 * Requires a Machine-to-Machine application in Auth0 with:
 * - Grant: Client Credentials
 * - API: Auth0 Management API with scopes: update:users, read:users
 *
 * @see https://auth0.com/docs/secure/tokens/access-tokens/management-api-access-tokens
 * @see https://auth0.com/docs/manage-users/user-accounts/metadata/manage-metadata-api
 */
import { config } from '../config/env.js'

let cachedToken: { token: string; expiresAt: number } | null = null

/** Get Management API access token (cached until ~5 min before expiry). */
export async function getManagementAccessToken(): Promise<string | null> {
  if (!config.auth0Management) return null

  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
    return cachedToken.token
  }

  const { domain, clientId, clientSecret, audience } = config.auth0Management
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience,
    }),
  })

  if (!res.ok) return null

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 86400) * 1000,
  }
  return cachedToken.token
}

/** Auth0 user_id is the sub claim (e.g. "auth0|xxx" or "google-oauth2|xxx"). */
export async function patchAuth0User(
  userId: string,
  body: {
    user_metadata?: Record<string, unknown>
    picture?: string
    name?: string
    password?: string
  },
): Promise<boolean> {
  const token = await getManagementAccessToken()
  if (!token || !config.auth0Management) return false

  const { domain } = config.auth0Management
  const url = `https://${domain}/api/v2/users/${encodeURIComponent(userId)}`

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return res.ok
}

/** Update only user_metadata (merge). */
export async function updateAuth0UserMetadata(
  userId: string,
  user_metadata: Record<string, unknown>,
): Promise<boolean> {
  return patchAuth0User(userId, { user_metadata })
}

/** Set user password (database connection users only). */
export async function setAuth0UserPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  return patchAuth0User(userId, { password })
}

export interface Auth0UserSummary {
  user_id: string
  email: string | null
  name: string | null
  picture: string | null
}

/** List users from Auth0 (Management API). For adding to team/collaborators. */
export async function listAuth0Users(
  page = 0,
  perPage = 50,
): Promise<{ users: Auth0UserSummary[]; total: number }> {
  const token = await getManagementAccessToken()
  if (!token || !config.auth0Management) return { users: [], total: 0 }

  const { domain } = config.auth0Management
  const url = `https://${domain}/api/v2/users?page=${page}&per_page=${perPage}&include_totals=true&sort=email:1`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return { users: [], total: 0 }

  const data = (await res.json()) as {
    users: Array<{
      user_id: string
      email?: string | null
      name?: string | null
      picture?: string | null
    }>
    total: number
  }

  const users: Auth0UserSummary[] = (data.users ?? []).map((u) => ({
    user_id: u.user_id,
    email: u.email ?? null,
    name: u.name ?? null,
    picture: u.picture ?? null,
  }))
  return { users, total: data.total ?? users.length }
}
