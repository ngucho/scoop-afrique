/**
 * CRM payment service
 */
import { getSupabase } from '../../lib/supabase.js'
import { logActivity } from './activity.service.js'
import { updateInvoiceAmountPaid } from './invoice.service.js'
import type { CreatePaymentInput } from '../../schemas/crm/payment.schema.js'

export async function listPaymentsByInvoice(invoiceId: string): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('paid_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Array<Record<string, unknown>>
}

export async function getPaymentById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_payments').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function getPaymentWithInvoice(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_payments')
    .select(
      `
      *,
      crm_invoices (
        id, reference, total, amount_paid, contact_id,
        crm_contacts (id, first_name, last_name, email, company)
      )
    `
    )
    .eq('id', id)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function createPayment(
  invoiceId: string,
  input: CreatePaymentInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const paidAt = input.paid_at ? new Date(input.paid_at).toISOString() : new Date().toISOString()

  const insert: Record<string, unknown> = {
    invoice_id: invoiceId,
    amount: input.amount,
    currency: input.currency ?? 'FCFA',
    method: input.method ?? 'other',
    reference: input.reference?.trim() || null,
    paid_at: paidAt,
    notes: input.notes?.trim() || null,
    created_by: createdBy ?? null,
  }

  const { data, error } = await supabase.from('crm_payments').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const payment = data as Record<string, unknown>

  // Update invoice amount_paid (new payment is already in DB)
  const payments = await listPaymentsByInvoice(invoiceId)
  const totalPaid = payments.reduce((sum, p) => sum + ((p.amount as number) ?? 0), 0)
  await updateInvoiceAmountPaid(invoiceId, totalPaid, paidAt)

  await logActivity({
    entityType: 'payment',
    entityId: payment.id as string,
    action: 'created',
    description: `Paiement de ${input.amount} ${input.currency} enregistré`,
    metadata: { invoice_id: invoiceId },
    createdBy: createdBy ?? undefined,
  })
  return payment
}

export async function setPaymentReceiptPdfUrl(id: string, receiptPdfUrl: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('crm_payments').update({ receipt_pdf_url: receiptPdfUrl }).eq('id', id)
}
