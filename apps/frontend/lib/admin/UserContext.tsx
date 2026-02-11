'use client'

/**
 * Admin user session context with sessionStorage caching.
 *
 * All identity and personal data comes from Auth0 (session + custom claims).
 * Permissions and role come from the Auth0 token (server layout); they are
 * cached and read-only (not editable by the client).
 */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import type { AppRole } from './rbac'
import type { UserMetadata } from './session'

/** Read-only admin user: permissions and role from token, metadata from Auth0 session */
export interface AdminUser {
  email?: string
  name?: string
  avatar?: string
  /** Role derived from token permissions; cached, read-only */
  role: AppRole
  /** Permissions from Auth0 JWT; cached, read-only */
  readonly permissions: readonly string[]
  /** User-editable metadata from Auth0 user_metadata custom claim */
  metadata?: UserMetadata
}

const AdminUserContext = createContext<AdminUser | null>(null)

const STORAGE_KEY = 'scoop_admin_user'

/** Reads cached user from sessionStorage. */
function getCachedUser(): AdminUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      email: parsed.email as string | undefined,
      name: parsed.name as string | undefined,
      avatar: parsed.avatar as string | undefined,
      role: (parsed.role as AdminUser['role']) ?? 'journalist',
      permissions: Array.isArray(parsed.permissions) ? (parsed.permissions as readonly string[]) : [],
      metadata: (parsed.metadata ?? {}) as UserMetadata,
    }
  } catch {
    return null
  }
}

/** Writes user to sessionStorage. */
function setCachedUser(user: AdminUser) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch {
    // Storage full or unavailable
  }
}

/** Clears cached user (call on logout). */
export function clearCachedUser() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function AdminUserProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser: AdminUser
}) {
  const user = useMemo(() => initialUser, [initialUser])

  useEffect(() => {
    setCachedUser(user)
  }, [user])

  return (
    <AdminUserContext.Provider value={user}>
      {children}
    </AdminUserContext.Provider>
  )
}

/** Get the current admin user from context. */
export function useAdminUser(): AdminUser {
  const ctx = useContext(AdminUserContext)
  if (!ctx) {
    const cached = getCachedUser()
    if (cached) return cached
    return { role: 'journalist', permissions: [] }
  }
  return ctx
}
