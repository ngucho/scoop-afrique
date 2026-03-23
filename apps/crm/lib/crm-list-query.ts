/** Build query string for CRM list pages (contacts, organizations). */

export type ContactsListParams = {
  search?: string
  type?: string
  country?: string
  city?: string
  sort?: string
  order?: string
  limit?: number
  archived?: boolean
}

export function buildContactsQuery(p: ContactsListParams): string {
  const q = new URLSearchParams()
  q.set('limit', String(p.limit ?? 100))
  if (p.search) q.set('search', p.search)
  if (p.type) q.set('type', p.type)
  if (p.country) q.set('country', p.country)
  if (p.city) q.set('city', p.city)
  if (p.sort) q.set('sort', p.sort)
  if (p.order) q.set('order', p.order)
  if (p.archived === true) q.set('archived', 'true')
  return q.toString()
}

export function sortToggleHref(
  base: ContactsListParams,
  column: 'created_at' | 'last_name' | 'email' | 'company'
): string {
  const nextOrder =
    base.sort === column ? (base.order === 'asc' ? 'desc' : 'asc') : 'asc'
  return `/contacts?${buildContactsQuery({ ...base, sort: column, order: nextOrder })}`
}

export type OrganizationsListParams = {
  search?: string
  type?: string
  country?: string
  sort?: string
  order?: string
  limit?: number
}

export function buildOrganizationsQuery(p: OrganizationsListParams): string {
  const q = new URLSearchParams()
  q.set('limit', String(p.limit ?? 100))
  if (p.search) q.set('search', p.search)
  if (p.type) q.set('type', p.type)
  if (p.country) q.set('country', p.country)
  if (p.sort) q.set('sort', p.sort)
  if (p.order) q.set('order', p.order)
  return q.toString()
}

export function orgSortToggleHref(
  base: OrganizationsListParams,
  column: 'name' | 'created_at'
): string {
  const nextOrder =
    base.sort === column ? (base.order === 'asc' ? 'desc' : 'asc') : column === 'name' ? 'asc' : 'desc'
  return `/organizations?${buildOrganizationsQuery({ ...base, sort: column, order: nextOrder })}`
}
