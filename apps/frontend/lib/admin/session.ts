/**
 * Server-side helper to get the current admin user from the Auth0 session.
 *
 * All user identity and personal data comes from Auth0 (session + access token).
 * user_metadata lives in the ACCESS TOKEN payload (getAccessToken), not in getSession().
 * The Post-Login Action adds `https://www.scoop-afrique.com/user_metadata` to the token.
 */
import { getSession, getAccessToken, getAccessTokenPayload, getUserMetadataFromPayload } from '@/lib/auth0'
import { roleFromPermissions, type AppRole } from './rbac'

/** User-editable metadata stored in Auth0 user_metadata. */
export interface UserMetadata {
  name?: string
  address?: string
  phone?: string
  sex?: string
}

/** Resolved admin session — built entirely from Auth0 (no backend call). */
export interface AdminSession {
  email: string
  name: string
  avatar?: string
  role: AppRole
  permissions: string[]
  metadata: UserMetadata
}

/**
 * Get the current admin session from Auth0.
 * Returns null if the user is not logged in or has no admin permissions.
 *
 * Call this from any server component inside the `(protected)` layout
 * to get the user's identity without hitting the backend.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getSession()
  if (!session?.user) return null

  const tokenResult = await getAccessToken()
  if (!tokenResult?.accessToken) return null

  const permissions = Array.isArray(tokenResult.permissions)
    ? tokenResult.permissions
    : []
  if (permissions.length === 0) return null

  const role = roleFromPermissions(permissions)

  // user_metadata is in the access token payload, not in session.user
  const payload = await getAccessTokenPayload()
  const rawMeta = payload ? getUserMetadataFromPayload(payload) : {}
  const metadata: UserMetadata = {
    name: rawMeta.name ?? undefined,
    address: rawMeta.address ?? undefined,
    phone: rawMeta.phone ?? undefined,
    sex: rawMeta.sex ?? undefined,
  }

  return {
    email: session.user.email ?? '',
    name: metadata.name ?? session.user.name ?? '',
    avatar: session.user.picture ?? undefined,
    role,
    permissions,
    metadata,
  }
}
