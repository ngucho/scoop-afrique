/**
 * CRM contact service
 */
import { eq, and, desc, asc, or, ilike, count, sql } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmContacts } from '../../db/schema.js'
import { config } from '../../config/env.js'
import { logActivity } from './activity.service.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateContactInput, UpdateContactInput } from '../../schemas/crm/contact.schema.js'

export async function listContacts(params: {
  type?: string
  country?: string
  city?: string
  search?: string
  sort?: 'created_at' | 'last_name' | 'email' | 'company'
  order?: 'asc' | 'desc'
  limit?: number
  offset?: number
  archived?: boolean
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  const conditions: Parameters<typeof and>[number][] = []
  if (params.type) conditions.push(eq(crmContacts.type, params.type as any))
  if (params.country) conditions.push(eq(crmContacts.country, params.country))
  if (params.city) conditions.push(ilike(crmContacts.city, `%${params.city}%`))
  // Soft-delete: hide archived contacts by default
  if (params.archived === true) conditions.push(eq(crmContacts.isArchived, true))
  else conditions.push(eq(crmContacts.isArchived, false))
  if (params.search) {
    const s = `%${params.search}%`
    conditions.push(
      or(
        ilike(crmContacts.firstName, s),
        ilike(crmContacts.lastName, s),
        ilike(crmContacts.email ?? '', s),
        ilike(crmContacts.company ?? '', s),
        ilike(crmContacts.phone ?? '', s),
        ilike(crmContacts.whatsapp ?? '', s),
        ilike(crmContacts.city ?? '', s)
      )!
    )
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [countRow] = await db.select({ count: count() }).from(crmContacts).where(whereClause)
  const total = countRow?.count ?? 0

  const sortKey = params.sort ?? 'created_at'
  const orderFn = params.order === 'asc' ? asc : desc
  const orderCol =
    sortKey === 'last_name'
      ? crmContacts.lastName
      : sortKey === 'email'
        ? crmContacts.email
        : sortKey === 'company'
          ? crmContacts.company
          : crmContacts.createdAt

  const rows = await db
    .select()
    .from(crmContacts)
    .where(whereClause)
    .orderBy(orderFn(orderCol), asc(crmContacts.id))
    .limit(limit)
    .offset(offset)

  return { data: rows.map((r) => toSnakeRecord(r as Record<string, unknown>)), total }
}

export async function getContactById(id: string): Promise<Record<string, unknown> | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db.select().from(crmContacts).where(eq(crmContacts.id, id)).limit(1)
  return row ? toSnakeRecord(row as Record<string, unknown>) : null
}

export async function getContactByEmail(email: string): Promise<Record<string, unknown> | null> {
  if (!config.database) return null
  const db = getDb()
  const normalized = email.trim().toLowerCase()
  const [row] = await db
    .select()
    .from(crmContacts)
    .where(sql`lower(trim(${crmContacts.email})) = ${normalized}`)
    .limit(1)
  return row ? toSnakeRecord(row as Record<string, unknown>) : null
}

export async function createContact(
  input: CreateContactInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()

  // If email provided, check for existing contact and return it instead of creating
  if (input.email?.trim()) {
    const existing = await getContactByEmail(input.email.trim())
    if (existing) return existing
  }

  const [row] = await db
    .insert(crmContacts)
    .values({
      type: (input.type ?? 'prospect') as any,
      firstName: input.first_name.trim(),
      lastName: input.last_name.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      company: input.company?.trim() || null,
      position: input.position?.trim() || null,
      country: input.country ?? 'CI',
      city: input.city?.trim() || null,
      source: input.source?.trim() || null,
      devisRequestId: input.devis_request_id || null,
      tags: input.tags ?? [],
      notes: input.notes?.trim() || null,
      assignedTo: input.assigned_to || null,
      createdBy: createdBy ?? null,
    })
    .returning()
  if (!row) throw new Error('Failed to create contact')
  const contact = toSnakeRecord(row as Record<string, unknown>)
  await logActivity({
    entityType: 'contact',
    entityId: row.id,
    action: 'created',
    description: `Contact ${input.first_name} ${input.last_name} créé`,
    createdBy: createdBy ?? undefined,
  })
  return contact
}

export async function updateContact(
  id: string,
  input: UpdateContactInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  const update: Partial<typeof crmContacts.$inferInsert> = {}
  if (input.type !== undefined) update.type = input.type as any
  if (input.first_name !== undefined) update.firstName = input.first_name.trim()
  if (input.last_name !== undefined) update.lastName = input.last_name.trim()
  if (input.email !== undefined) update.email = input.email?.trim() || null
  if (input.phone !== undefined) update.phone = input.phone?.trim() || null
  if (input.whatsapp !== undefined) update.whatsapp = input.whatsapp?.trim() || null
  if (input.company !== undefined) update.company = input.company?.trim() || null
  if (input.position !== undefined) update.position = input.position?.trim() || null
  if (input.country !== undefined) update.country = input.country
  if (input.city !== undefined) update.city = input.city?.trim() || null
  if (input.source !== undefined) update.source = input.source?.trim() || null
  if (input.devis_request_id !== undefined) update.devisRequestId = input.devis_request_id || null
  if (input.tags !== undefined) update.tags = input.tags
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.assigned_to !== undefined) update.assignedTo = input.assigned_to || null
  if (input.is_archived !== undefined) update.isArchived = input.is_archived

  const [row] = await db.update(crmContacts).set(update).where(eq(crmContacts.id, id)).returning()
  if (!row) throw new Error('Contact not found')
  await logActivity({
    entityType: 'contact',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function archiveContact(id: string, archivedBy?: string): Promise<void> {
  await updateContact(id, { is_archived: true }, archivedBy)
}
