/**
 * CRM payment service
 */
import { eq, desc } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmPayments, crmInvoices, crmContacts } from '../../db/schema.js'
import { logActivity } from './activity.service.js'
import { updateInvoiceAmountPaid } from './invoice.service.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreatePaymentInput } from '../../schemas/crm/payment.schema.js'

export async function listPaymentsByInvoice(invoiceId: string): Promise<Array<Record<string, unknown>>> {
  const db = getDb()
  const rows = await db
    .select()
    .from(crmPayments)
    .where(eq(crmPayments.invoiceId, invoiceId))
    .orderBy(desc(crmPayments.paidAt))
  return rows.map((r) => toSnakeRecord(r as Record<string, unknown>))
}

export async function getPaymentById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmPayments).where(eq(crmPayments.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function getPaymentWithInvoice(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db
    .select({
      payment: crmPayments,
      invoice: {
        id: crmInvoices.id,
        reference: crmInvoices.reference,
        total: crmInvoices.total,
        amountPaid: crmInvoices.amountPaid,
        contactId: crmInvoices.contactId,
      },
      contact: {
        id: crmContacts.id,
        firstName: crmContacts.firstName,
        lastName: crmContacts.lastName,
        email: crmContacts.email,
        company: crmContacts.company,
      },
    })
    .from(crmPayments)
    .leftJoin(crmInvoices, eq(crmPayments.invoiceId, crmInvoices.id))
    .leftJoin(crmContacts, eq(crmInvoices.contactId, crmContacts.id))
    .where(eq(crmPayments.id, id))
    .limit(1)

  const row = rows[0]
  if (!row) return null
  const out = toSnakeRecord(row.payment as Record<string, unknown>) as Record<string, unknown>
  if (row.invoice?.id) {
    const invRec = toSnakeRecord(row.invoice as Record<string, unknown>) as Record<string, unknown>
    if (row.contact?.id) {
      invRec.crm_contacts = toSnakeRecord(row.contact as Record<string, unknown>)
    }
    out.crm_invoices = invRec
  }
  return out
}

export async function createPayment(
  invoiceId: string,
  input: CreatePaymentInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const paidAt = input.paid_at ? new Date(input.paid_at) : new Date()

  const [payment] = await db
    .insert(crmPayments)
    .values({
      invoiceId,
      amount: input.amount,
      currency: input.currency ?? 'FCFA',
      method: (input.method ?? 'other') as typeof crmPayments.method.enumValues[number],
      reference: input.reference?.trim() || null,
      paidAt,
      notes: input.notes?.trim() || null,
      createdBy: createdBy ?? null,
    })
    .returning()

  if (!payment) throw new Error('Failed to create payment')

  const payments = await listPaymentsByInvoice(invoiceId)
  const totalPaid = payments.reduce((sum, p) => sum + ((p.amount as number) ?? 0), 0)
  await updateInvoiceAmountPaid(invoiceId, totalPaid, paidAt.toISOString())

  await logActivity({
    entityType: 'payment',
    entityId: payment.id,
    action: 'created',
    description: `Paiement de ${input.amount} ${input.currency} enregistré`,
    metadata: { invoice_id: invoiceId },
    createdBy: createdBy ?? undefined,
  })
  return toSnakeRecord(payment as Record<string, unknown>)
}

export async function setPaymentReceiptPdfUrl(id: string, receiptPdfUrl: string): Promise<void> {
  const db = getDb()
  await db.update(crmPayments).set({ receiptPdfUrl }).where(eq(crmPayments.id, id))
}
