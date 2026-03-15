/**
 * CRM devis (quote) service
 */
import { eq, and, desc, sql } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmDevis, crmContacts, crmProjects } from '../../db/schema.js'
import { nextReference } from '../../lib/reference.js'
import { logActivity } from './activity.service.js'
import { computeLineItems } from './line-items.util.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateDevisInput, UpdateDevisInput } from '../../schemas/crm/devis.schema.js'

export async function listDevis(params?: {
  contactId?: string
  projectId?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const db = getDb()
  const conditions = []
  if (params?.contactId) conditions.push(eq(crmDevis.contactId, params.contactId))
  if (params?.projectId) conditions.push(eq(crmDevis.projectId, params.projectId))
  if (params?.status) conditions.push(eq(crmDevis.status, params.status as typeof crmDevis.status.enumValues[number]))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(crmDevis)
      .where(whereClause)
      .orderBy(desc(crmDevis.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmDevis)
      .where(whereClause),
  ])

  return {
    data: rows.map((r) => toSnakeRecord(r as Record<string, unknown>)),
    total: count ?? 0,
  }
}

export async function getDevisById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmDevis).where(eq(crmDevis.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function getDevisWithContact(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db
    .select({
      devis: crmDevis,
      contact: {
        id: crmContacts.id,
        firstName: crmContacts.firstName,
        lastName: crmContacts.lastName,
        email: crmContacts.email,
        phone: crmContacts.phone,
        whatsapp: crmContacts.whatsapp,
        company: crmContacts.company,
      },
    })
    .from(crmDevis)
    .leftJoin(crmContacts, eq(crmDevis.contactId, crmContacts.id))
    .where(eq(crmDevis.id, id))
    .limit(1)

  const row = rows[0]
  if (!row) return null
  const out = toSnakeRecord(row.devis as Record<string, unknown>) as Record<string, unknown>
  if (row.contact?.id) {
    out.crm_contacts = toSnakeRecord(row.contact as Record<string, unknown>)
  }
  return out
}

function computeTotals(
  lineItems: Array<{ description: string; quantity: number; unit_price: number; unit?: string; tax_rate?: number }>,
  taxRate: number
) {
  return computeLineItems(
    lineItems.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      unit: i.unit,
      tax_rate: i.tax_rate,
    })),
    taxRate
  )
}

export async function createDevis(
  input: CreateDevisInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const reference = await nextReference('DV')
  const { lineItems, subtotal, taxAmount, total } = computeTotals(input.line_items, input.tax_rate ?? 0)

  const db = getDb()
  let contactId = input.contact_id || null
  if (input.project_id && !contactId) {
    const projectRows = await db
      .select({ contactId: crmProjects.contactId })
      .from(crmProjects)
      .where(eq(crmProjects.id, input.project_id))
      .limit(1)
    if (projectRows[0]?.contactId) contactId = projectRows[0].contactId
  }

  const lineItemsWithDesc = lineItems.map((i, idx) => ({
    ...i,
    description: input.line_items[idx].description,
    unit: input.line_items[idx].unit ?? 'unité',
  }))

  const [devis] = await db
    .insert(crmDevis)
    .values({
      reference,
      projectId: input.project_id || null,
      contactId,
      devisRequestId: input.devis_request_id || null,
      serviceSlug: input.service_slug?.trim() || null,
      title: input.title.trim(),
      lineItems: lineItemsWithDesc,
      subtotal,
      taxRate: input.tax_rate ?? 0,
      taxAmount,
      total,
      currency: input.currency ?? 'FCFA',
      validUntil: input.valid_until || null,
      notes: input.notes?.trim() || null,
      internalNotes: input.internal_notes?.trim() || null,
      createdBy: createdBy ?? null,
    })
    .returning()

  if (!devis) throw new Error('Failed to create devis')
  await logActivity({
    entityType: 'devis',
    entityId: devis.id,
    action: 'created',
    description: `Devis ${reference} créé`,
    createdBy: createdBy ?? undefined,
  })
  return toSnakeRecord(devis as Record<string, unknown>)
}

export async function updateDevis(
  id: string,
  input: UpdateDevisInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const existing = await getDevisById(id)
  if (!existing) throw new Error('Devis non trouvé')

  const update: Partial<typeof crmDevis.$inferInsert> = {}
  if (input.status !== undefined) update.status = input.status as typeof crmDevis.status.enumValues[number]
  if (input.project_id !== undefined) update.projectId = input.project_id || null
  if (input.contact_id !== undefined) update.contactId = input.contact_id || null
  if (input.devis_request_id !== undefined) update.devisRequestId = input.devis_request_id || null
  if (input.service_slug !== undefined) update.serviceSlug = input.service_slug?.trim() || null
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.internal_notes !== undefined) update.internalNotes = input.internal_notes?.trim() || null
  if (input.valid_until !== undefined) update.validUntil = input.valid_until || null
  if (input.currency !== undefined) update.currency = input.currency

  if (input.line_items && input.line_items.length > 0) {
    const { lineItems, subtotal, taxAmount, total } = computeTotals(
      input.line_items,
      input.tax_rate ?? (existing.tax_rate as number) ?? 0
    )
    update.lineItems = lineItems.map((i, idx) => ({
      ...i,
      description: input.line_items![idx].description,
      unit: input.line_items![idx].unit ?? 'unité',
    }))
    update.subtotal = subtotal
    update.taxRate = input.tax_rate ?? (existing.tax_rate as number)
    update.taxAmount = taxAmount
    update.total = total
  }

  const [devis] = await db.update(crmDevis).set(update).where(eq(crmDevis.id, id)).returning()
  if (!devis) throw new Error('Failed to update devis')
  await logActivity({
    entityType: 'devis',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return toSnakeRecord(devis as Record<string, unknown>)
}

export async function markDevisSent(id: string, updatedBy?: string): Promise<Record<string, unknown>> {
  const db = getDb()
  const [devis] = await db
    .update(crmDevis)
    .set({ status: 'sent', sentAt: new Date() })
    .where(eq(crmDevis.id, id))
    .returning()
  if (!devis) throw new Error('Failed to update devis')
  await logActivity({
    entityType: 'devis',
    entityId: id,
    action: 'sent',
    createdBy: updatedBy ?? undefined,
  })
  return toSnakeRecord(devis as Record<string, unknown>)
}

export async function markDevisAccepted(id: string, updatedBy?: string): Promise<Record<string, unknown>> {
  const db = getDb()
  const [devis] = await db
    .update(crmDevis)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(crmDevis.id, id))
    .returning()
  if (!devis) throw new Error('Failed to update devis')
  await logActivity({
    entityType: 'devis',
    entityId: id,
    action: 'accepted',
    createdBy: updatedBy ?? undefined,
  })
  return toSnakeRecord(devis as Record<string, unknown>)
}

export async function setDevisPdfUrl(id: string, pdfUrl: string): Promise<void> {
  const db = getDb()
  await db.update(crmDevis).set({ pdfUrl }).where(eq(crmDevis.id, id))
}
