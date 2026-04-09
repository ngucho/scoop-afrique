/**
 * RBAC helpers for the admin app.
 * Role is derived from Auth0 JWT permissions (same mapping as backend); not editable.
 */

export type AppRole = 'journalist' | 'editor' | 'manager' | 'admin'

/**
 * Derive role from Auth0 permissions (must match backend apps/backend/src/lib/auth0.ts).
 * Used for access control and caching; source of truth is the token.
 */
export function roleFromPermissions(permissions: string[]): AppRole {
  if (permissions.includes('manage:users')) return 'admin'
  if (permissions.includes('delete:articles')) return 'manager'
  if (permissions.includes('publish:articles')) return 'editor'
  if (
    permissions.includes('create:articles') ||
    permissions.includes('read:articles')
  )
    return 'journalist'
  return 'journalist'
}

/** Role hierarchy: higher index = more permissions */
const ROLE_HIERARCHY: AppRole[] = ['journalist', 'editor', 'manager', 'admin']

export function roleLevel(role: AppRole): number {
  return ROLE_HIERARCHY.indexOf(role)
}

export function hasMinRole(userRole: AppRole, minRole: AppRole): boolean {
  return roleLevel(userRole) >= roleLevel(minRole)
}

export function canEditArticle(
  userRole: AppRole,
  userId: string,
  articleAuthorId: string
): boolean {
  if (hasMinRole(userRole, 'editor')) return true
  return userId === articleAuthorId
}

export function canPublish(role: AppRole): boolean {
  return hasMinRole(role, 'editor')
}

export function canDelete(role: AppRole): boolean {
  return hasMinRole(role, 'manager')
}

export function canModerateComments(role: AppRole): boolean {
  return hasMinRole(role, 'editor')
}

export function canManageUsers(role: AppRole): boolean {
  return hasMinRole(role, 'admin')
}

export function canManageTeams(role: AppRole): boolean {
  return hasMinRole(role, 'manager')
}

export function canManageCategories(role: AppRole): boolean {
  return hasMinRole(role, 'manager')
}

/** KPIs reader + annonces (éditeur et plus). */
export function canViewReaderInsights(role: AppRole): boolean {
  return hasMinRole(role, 'editor')
}

/** Publicité, homepage CMS, abonnés, campagnes newsletter. */
export function canManageReaderOperations(role: AppRole): boolean {
  return hasMinRole(role, 'manager')
}

export function canEditAnnouncements(role: AppRole): boolean {
  return hasMinRole(role, 'editor')
}

/** Navigation items visible per role */
export interface NavItem {
  href: string
  label: string
  icon: string // lucide icon name
  minRole: AppRole
}

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Tableau de bord', icon: 'LayoutDashboard', minRole: 'journalist' },
  { href: '/admin/articles', label: 'Articles', icon: 'FileText', minRole: 'journalist' },
  { href: '/admin/comments', label: 'Commentaires', icon: 'MessageSquare', minRole: 'editor' },
  { href: '/admin/media', label: 'Médias', icon: 'Image', minRole: 'journalist' },
  { href: '/admin/reader/announcements', label: 'Annonces reader', icon: 'Megaphone', minRole: 'editor' },
  { href: '/admin/reader/ads', label: 'Publicité', icon: 'Ad', minRole: 'manager' },
  { href: '/admin/reader/homepage', label: 'Accueil (sections)', icon: 'LayoutGrid', minRole: 'manager' },
  { href: '/admin/reader/subscribers', label: 'Abonnés', icon: 'Mail', minRole: 'manager' },
  { href: '/admin/reader/newsletters', label: 'Newsletters', icon: 'Calendar', minRole: 'manager' },
  { href: '/admin/categories', label: 'Catégories', icon: 'Tags', minRole: 'manager' },
  { href: '/admin/team', label: 'Équipe', icon: 'Users', minRole: 'manager' },
  { href: '/admin/users', label: 'Utilisateurs', icon: 'Shield', minRole: 'admin' },
  { href: '/admin/settings', label: 'Paramètres', icon: 'Settings', minRole: 'journalist' },
]

export function getVisibleNav(role: AppRole): NavItem[] {
  return ADMIN_NAV.filter((item) => hasMinRole(role, item.minRole))
}

export const ROLE_LABELS: Record<AppRole, string> = {
  journalist: 'Journaliste',
  editor: 'Éditeur',
  manager: 'Manager',
  admin: 'Administrateur',
}

export const ROLE_COLORS: Record<AppRole, string> = {
  journalist: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  editor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  manager: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  review: 'En révision',
  scheduled: 'Programmé',
  published: 'Publié',
}

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}
