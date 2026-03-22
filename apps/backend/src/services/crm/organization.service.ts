/**
 * CRM organization service
 */
import { eq, and, or, ilike, inArray, sql, desc, asc } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmOrganizations, crmContactOrganization, crmContacts } from '../../db/schema.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateOrganizationInput, UpdateOrganizationInput } from '../../schemas/crm/organization.schema.js'

export async function listOrganizations(params?: {
  search?: string
  type?: string
  country?: string
  sort?: 'name' | 'created_at'
  order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const db = getDb()
  const conditions = []
  if (params?.search) {
    const pattern = `%${params.search}%`
    conditions.push(
      or(
        ilike(crmOrganizations.name, pattern),
        ilike(crmOrganizations.email ?? '', pattern),
        ilike(crmOrganizations.website ?? '', pattern),
        ilike(crmOrganizations.phone ?? '', pattern),
        ilike(crmOrganizations.address ?? '', pattern)
      )!
    )
  }
  if (params?.type?.trim()) {
    const t = `%${params.type.trim()}%`
    conditions.push(ilike(crmOrganizations.type, t))
  }
  if (params?.country) conditions.push(eq(crmOrganizations.country, params.country))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const sortKey = params?.sort ?? 'name'
  const orderFn = params?.order === 'desc' ? desc : asc
  const orderCol =
    sortKey === 'created_at' ? crmOrganizations.createdAt : crmOrganizations.name

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(crmOrganizations)
      .where(whereClause)
      .orderBy(orderFn(orderCol), asc(crmOrganizations.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmOrganizations)
      .where(whereClause),
  ])

  return {
    data: rows.map((r) => toSnakeRecord(r as Record<string, unknown>)),
    total: count ?? 0,
  }
}

export async function getOrganizationById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmOrganizations).where(eq(crmOrganizations.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function createOrganization(
  input: CreateOrganizationInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const [org] = await db
    .insert(crmOrganizations)
    .values({
      name: input.name.trim(),
      type: input.type?.trim() || null,
      website: input.website?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      country: input.country ?? 'CI',
      notes: input.notes?.trim() || null,
      tags: input.tags ?? [],
      createdBy: createdBy ?? null,
    })
    .returning()

  if (!org) throw new Error('Failed to create organization')
  return toSnakeRecord(org as Record<string, unknown>)
}

export async function updateOrganization(
  id: string,
  input: UpdateOrganizationInput
): Promise<Record<string, unknown>> {
  const db = getDb()
  const update: Partial<typeof crmOrganizations.$inferInsert> = {}
  if (input.name !== undefined) update.name = input.name.trim()
  if (input.type !== undefined) update.type = input.type?.trim() || null
  if (input.website !== undefined) update.website = input.website?.trim() || null
  if (input.email !== undefined) update.email = input.email?.trim() || null
  if (input.phone !== undefined) update.phone = input.phone?.trim() || null
  if (input.address !== undefined) update.address = input.address?.trim() || null
  if (input.country !== undefined) update.country = input.country
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.tags !== undefined) update.tags = input.tags

  const [org] = await db.update(crmOrganizations).set(update).where(eq(crmOrganizations.id, id)).returning()
  if (!org) throw new Error('Failed to update organization')
  return toSnakeRecord(org as Record<string, unknown>)
}

export async function getContactOrganizations(contactId: string): Promise<Array<Record<string, unknown>>> {
  const db = getDb()
  const links = await db
    .select({ organizationId: crmContactOrganization.organizationId, role: crmContactOrganization.role })
    .from(crmContactOrganization)
    .where(eq(crmContactOrganization.contactId, contactId))

  if (!links.length) return []

  const orgIds = links.map((l) => l.organizationId)
  const orgs = await db
    .select({ id: crmOrganizations.id, name: crmOrganizations.name, type: crmOrganizations.type })
    .from(crmOrganizations)
    .where(inArray(crmOrganizations.id, orgIds))

  const roleByOrg = Object.fromEntries(links.map((l) => [l.organizationId, l.role]))
  return orgs.map((o) => {
    const rec = toSnakeRecord(o as Record<string, unknown>) as Record<string, unknown>
    rec.role = roleByOrg[o.id] ?? null
    return rec
  })
}

export async function getOrganizationContacts(organizationId: string): Promise<Array<Record<string, unknown>>> {
  const db = getDb()
  const links = await db
    .select({ contactId: crmContactOrganization.contactId, role: crmContactOrganization.role })
    .from(crmContactOrganization)
    .where(eq(crmContactOrganization.organizationId, organizationId))

  if (!links.length) return []

  const contactIds = links.map((l) => l.contactId)
  const contacts = await db
    .select({ id: crmContacts.id, firstName: crmContacts.firstName, lastName: crmContacts.lastName, email: crmContacts.email })
    .from(crmContacts)
    .where(inArray(crmContacts.id, contactIds))

  const roleByContact = Object.fromEntries(links.map((l) => [l.contactId, l.role]))
  return contacts.map((c) => {
    const rec = toSnakeRecord(c as Record<string, unknown>) as Record<string, unknown>
    rec.role = roleByContact[c.id] ?? null
    return rec
  })
}

export async function linkContactOrganization(
  contactId: string,
  organizationId: string,
  role?: string
): Promise<void> {
  const db = getDb()
  await db
    .insert(crmContactOrganization)
    .values({
      contactId,
      organizationId,
      role: role ?? null,
    })
    .onConflictDoUpdate({
      target: [crmContactOrganization.contactId, crmContactOrganization.organizationId],
      set: { role: role ?? null },
    })
}

export async function unlinkContactOrganization(
  contactId: string,
  organizationId: string
): Promise<void> {
  const db = getDb()
  await db
    .delete(crmContactOrganization)
    .where(
      and(
        eq(crmContactOrganization.contactId, contactId),
        eq(crmContactOrganization.organizationId, organizationId)
      )
    )
}
