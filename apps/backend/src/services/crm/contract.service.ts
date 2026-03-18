/**
 * CRM contract service
 */
import { eq, and, desc, sql } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmContracts, crmContacts } from '../../db/schema.js'
import { nextReference } from '../../lib/reference.js'
import { logActivity } from './activity.service.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateContractInput, UpdateContractInput } from '../../schemas/crm/contract.schema.js'

export async function listContracts(params?: {
  projectId?: string
  contactId?: string
  status?: string
  archived?: boolean
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const db = getDb()
  const conditions = []
  if (params?.projectId) conditions.push(eq(crmContracts.projectId, params.projectId))
  if (params?.contactId) conditions.push(eq(crmContracts.contactId, params.contactId))
  if (params?.status) conditions.push(eq(crmContracts.status, params.status as typeof crmContracts.status.enumValues[number]))
  // Soft-delete: hide archived contracts by default
  if (params?.archived === true) conditions.push(eq(crmContracts.isArchived, true))
  else conditions.push(eq(crmContracts.isArchived, false))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(crmContracts)
      .where(whereClause)
      .orderBy(desc(crmContracts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmContracts)
      .where(whereClause),
  ])

  return {
    data: rows.map((r) => toSnakeRecord(r as Record<string, unknown>)),
    total: count ?? 0,
  }
}

export async function getContractById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmContracts).where(eq(crmContracts.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function getContractWithContact(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db
    .select({
      contract: crmContracts,
      contact: {
        id: crmContacts.id,
        firstName: crmContacts.firstName,
        lastName: crmContacts.lastName,
        email: crmContacts.email,
        company: crmContacts.company,
      },
    })
    .from(crmContracts)
    .leftJoin(crmContacts, eq(crmContracts.contactId, crmContacts.id))
    .where(eq(crmContracts.id, id))
    .limit(1)

  const row = rows[0]
  if (!row) return null
  const out = toSnakeRecord(row.contract as Record<string, unknown>) as Record<string, unknown>
  if (row.contact?.id) {
    out.crm_contacts = toSnakeRecord(row.contact as Record<string, unknown>)
  }
  return out
}

export async function createContract(
  input: CreateContractInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const reference = await nextReference('CTR')
  const db = getDb()

  const [contract] = await db
    .insert(crmContracts)
    .values({
      reference,
      projectId: input.project_id || null,
      contactId: input.contact_id || null,
      devisId: input.devis_id || null,
      type: input.type ?? 'service',
      title: input.title.trim(),
      content: input.content ?? {},
      expiresAt: input.expires_at || null,
      createdBy: createdBy ?? null,
    })
    .returning()

  if (!contract) throw new Error('Failed to create contract')
  await logActivity({
    entityType: 'contract',
    entityId: contract.id,
    action: 'created',
    description: `Contrat ${reference} créé`,
    createdBy: createdBy ?? undefined,
  })
  return toSnakeRecord(contract as Record<string, unknown>)
}

export async function updateContract(
  id: string,
  input: UpdateContractInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const update: Partial<typeof crmContracts.$inferInsert> = {}
  if (input.project_id !== undefined) update.projectId = input.project_id || null
  if (input.contact_id !== undefined) update.contactId = input.contact_id || null
  if (input.devis_id !== undefined) update.devisId = input.devis_id || null
  if (input.type !== undefined) update.type = input.type
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.content !== undefined) update.content = input.content
  if (input.expires_at !== undefined) update.expiresAt = input.expires_at || null
  if (input.status !== undefined) update.status = input.status as typeof crmContracts.status.enumValues[number]
  if (input.signed_at !== undefined) update.signedAt = input.signed_at ? new Date(input.signed_at) : null

  const [contract] = await db.update(crmContracts).set(update).where(eq(crmContracts.id, id)).returning()
  if (!contract) throw new Error('Failed to update contract')
  await logActivity({
    entityType: 'contract',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return toSnakeRecord(contract as Record<string, unknown>)
}

export async function archiveContract(id: string, archivedBy?: string): Promise<Record<string, unknown>> {
  const db = getDb()
  const [contract] = await db
    .update(crmContracts)
    .set({ isArchived: true })
    .where(eq(crmContracts.id, id))
    .returning()
  if (!contract) throw new Error('Failed to archive contract')

  await logActivity({
    entityType: 'contract',
    entityId: id,
    action: 'archived',
    description: `Contrat ${contract.reference} archivé`,
    createdBy: archivedBy ?? undefined,
  })

  return toSnakeRecord(contract as Record<string, unknown>)
}

export async function restoreContract(id: string, restoredBy?: string): Promise<Record<string, unknown>> {
  const db = getDb()
  const [contract] = await db
    .update(crmContracts)
    .set({ isArchived: false })
    .where(eq(crmContracts.id, id))
    .returning()
  if (!contract) throw new Error('Failed to restore contract')

  await logActivity({
    entityType: 'contract',
    entityId: id,
    action: 'restored',
    description: `Contrat ${contract.reference} restauré`,
    createdBy: restoredBy ?? undefined,
  })

  return toSnakeRecord(contract as Record<string, unknown>)
}

export async function markContractSigned(id: string, signedBy?: string): Promise<Record<string, unknown>> {
  const db = getDb()
  const [contract] = await db
    .update(crmContracts)
    .set({ status: 'signed', signedAt: new Date() })
    .where(eq(crmContracts.id, id))
    .returning()
  if (!contract) throw new Error('Failed to update contract')
  await logActivity({
    entityType: 'contract',
    entityId: id,
    action: 'signed',
    createdBy: signedBy ?? undefined,
  })
  return toSnakeRecord(contract as Record<string, unknown>)
}

export async function setContractPdfUrl(id: string, pdfUrl: string): Promise<void> {
  const db = getDb()
  await db.update(crmContracts).set({ pdfUrl }).where(eq(crmContracts.id, id))
}
