/**
 * CRM invoice service
 */
import { eq, and, desc, sql } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmInvoices, crmContacts, crmProjects } from '../../db/schema.js'
import { nextReference } from '../../lib/reference.js'
import { logActivity } from './activity.service.js'
import { computeLineItems } from './line-items.util.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateInvoiceInput, UpdateInvoiceInput } from '../../schemas/crm/invoice.schema.js'

export async function listInvoices(params?: {
  contactId?: string
  projectId?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const db = getDb()
  const conditions = []
  if (params?.contactId) conditions.push(eq(crmInvoices.contactId, params.contactId))
  if (params?.projectId) conditions.push(eq(crmInvoices.projectId, params.projectId))
  if (params?.status) conditions.push(eq(crmInvoices.status, params.status as typeof crmInvoices.status.enumValues[number]))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(crmInvoices)
      .where(whereClause)
      .orderBy(desc(crmInvoices.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmInvoices)
      .where(whereClause),
  ])

  return {
    data: rows.map((r) => toSnakeRecord(r as Record<string, unknown>)),
    total: count ?? 0,
  }
}

export async function getInvoiceById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmInvoices).where(eq(crmInvoices.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function getInvoiceWithContact(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db
    .select({
      invoice: crmInvoices,
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
    .from(crmInvoices)
    .leftJoin(crmContacts, eq(crmInvoices.contactId, crmContacts.id))
    .where(eq(crmInvoices.id, id))
    .limit(1)

  const row = rows[0]
  if (!row) return null
  const out = toSnakeRecord(row.invoice as Record<string, unknown>) as Record<string, unknown>
  if (row.contact?.id) {
    out.crm_contacts = toSnakeRecord(row.contact as Record<string, unknown>)
  }
  return out
}

export async function getInvoiceWithContactAndProject(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db
    .select({
      invoice: crmInvoices,
      contact: {
        id: crmContacts.id,
        firstName: crmContacts.firstName,
        lastName: crmContacts.lastName,
        email: crmContacts.email,
        phone: crmContacts.phone,
        whatsapp: crmContacts.whatsapp,
        company: crmContacts.company,
      },
      project: {
        id: crmProjects.id,
        reference: crmProjects.reference,
        title: crmProjects.title,
        description: crmProjects.description,
        startDate: crmProjects.startDate,
        endDate: crmProjects.endDate,
      },
    })
    .from(crmInvoices)
    .leftJoin(crmContacts, eq(crmInvoices.contactId, crmContacts.id))
    .leftJoin(crmProjects, eq(crmInvoices.projectId, crmProjects.id))
    .where(eq(crmInvoices.id, id))
    .limit(1)

  const row = rows[0]
  if (!row) return null
  const out = toSnakeRecord(row.invoice as Record<string, unknown>) as Record<string, unknown>
  if (row.contact?.id) {
    out.crm_contacts = toSnakeRecord(row.contact as Record<string, unknown>)
  }
  if (row.project?.id) {
    out.crm_projects = toSnakeRecord(row.project as Record<string, unknown>)
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

export async function createInvoice(
  input: CreateInvoiceInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const reference = await nextReference('FAC')
  const { lineItems, subtotal, taxAmount, total } = computeTotals(input.line_items, input.tax_rate ?? 0)
  const discount = Math.max(0, input.discount_amount ?? 0)
  const taxable = Math.max(0, subtotal - discount)
  const taxAmountWithDiscount = Math.round(taxable * ((input.tax_rate ?? 0) / 100))
  const totalWithDiscount = taxable + taxAmountWithDiscount

  const lineItemsWithDesc = lineItems.map((i, idx) => ({
    ...i,
    description: input.line_items[idx].description,
    unit: input.line_items[idx].unit ?? 'unité',
  }))

  const db = getDb()
  const [invoice] = await db
    .insert(crmInvoices)
    .values({
      reference,
      contactId: input.contact_id || null,
      projectId: input.project_id || null,
      devisId: input.devis_id || null,
      lineItems: lineItemsWithDesc,
      subtotal,
      taxRate: input.tax_rate ?? 0,
      taxAmount: taxAmountWithDiscount,
      total: totalWithDiscount,
      discountAmount: discount,
      amountPaid: 0,
      currency: input.currency ?? 'FCFA',
      dueDate: input.due_date || null,
      notes: input.notes?.trim() || null,
      internalNotes: input.internal_notes?.trim() || null,
      createdBy: createdBy ?? null,
    })
    .returning()

  if (!invoice) throw new Error('Failed to create invoice')
  await logActivity({
    entityType: 'invoice',
    entityId: invoice.id,
    action: 'created',
    description: `Facture ${reference} créée`,
    createdBy: createdBy ?? undefined,
  })
  return toSnakeRecord(invoice as Record<string, unknown>)
}

export async function updateInvoice(
  id: string,
  input: UpdateInvoiceInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const existing = await getInvoiceById(id)
  if (!existing) throw new Error('Facture non trouvée')

  const update: Partial<typeof crmInvoices.$inferInsert> = {}
  if (input.status !== undefined) update.status = input.status as typeof crmInvoices.status.enumValues[number]
  if (input.contact_id !== undefined) update.contactId = input.contact_id || null
  if (input.project_id !== undefined) update.projectId = input.project_id || null
  if (input.devis_id !== undefined) update.devisId = input.devis_id || null
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.internal_notes !== undefined) update.internalNotes = input.internal_notes?.trim() || null
  if (input.due_date !== undefined) update.dueDate = input.due_date || null
  if (input.currency !== undefined) update.currency = input.currency

  if (input.discount_amount !== undefined) update.discountAmount = Math.max(0, input.discount_amount)
  if (input.line_items && input.line_items.length > 0) {
    const { lineItems, subtotal } = computeTotals(
      input.line_items,
      input.tax_rate ?? (existing.tax_rate as number) ?? 0
    )
    const discount = Math.max(0, input.discount_amount ?? (existing.discount_amount as number) ?? 0)
    const taxable = Math.max(0, subtotal - discount)
    const taxRate = input.tax_rate ?? (existing.tax_rate as number) ?? 0
    const taxAmountWithDiscount = Math.round(taxable * (taxRate / 100))
    const totalWithDiscount = taxable + taxAmountWithDiscount
    update.lineItems = lineItems.map((i, idx) => ({
      ...i,
      description: input.line_items![idx].description,
      unit: input.line_items![idx].unit ?? 'unité',
    }))
    update.subtotal = subtotal
    update.taxRate = taxRate
    update.taxAmount = taxAmountWithDiscount
    update.total = totalWithDiscount
    update.discountAmount = discount
  }

  const [invoice] = await db.update(crmInvoices).set(update).where(eq(crmInvoices.id, id)).returning()
  if (!invoice) throw new Error('Failed to update invoice')
  await logActivity({
    entityType: 'invoice',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return toSnakeRecord(invoice as Record<string, unknown>)
}

export async function markInvoiceSent(id: string, updatedBy?: string): Promise<Record<string, unknown>> {
  const db = getDb()
  const [invoice] = await db
    .update(crmInvoices)
    .set({ status: 'sent', sentAt: new Date() })
    .where(eq(crmInvoices.id, id))
    .returning()
  if (!invoice) throw new Error('Failed to update invoice')
  await logActivity({
    entityType: 'invoice',
    entityId: id,
    action: 'sent',
    createdBy: updatedBy ?? undefined,
  })
  return toSnakeRecord(invoice as Record<string, unknown>)
}

export async function updateInvoiceAmountPaid(
  id: string,
  amountPaid: number,
  paidAt?: string
): Promise<void> {
  const db = getDb()
  const inv = await getInvoiceById(id)
  if (!inv) throw new Error('Facture non trouvée')
  const total = inv.total as number
  const status = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : (inv.status as string)
  await db
    .update(crmInvoices)
    .set({
      amountPaid,
      status: status as typeof crmInvoices.status.enumValues[number],
      paidAt: amountPaid >= total ? (paidAt ? new Date(paidAt) : new Date()) : null,
    })
    .where(eq(crmInvoices.id, id))
}

export async function setInvoicePdfUrl(id: string, pdfUrl: string): Promise<void> {
  const db = getDb()
  await db.update(crmInvoices).set({ pdfUrl }).where(eq(crmInvoices.id, id))
}
