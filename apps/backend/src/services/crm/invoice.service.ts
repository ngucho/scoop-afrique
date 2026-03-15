/**
 * CRM invoice service
 */
import { getSupabase } from '../../lib/supabase.js'
import { nextReference } from '../../lib/reference.js'
import { logActivity } from './activity.service.js'
import { computeLineItems } from './line-items.util.js'
import type { CreateInvoiceInput, UpdateInvoiceInput } from '../../schemas/crm/invoice.schema.js'

export async function listInvoices(params?: {
  contactId?: string
  projectId?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const supabase = getSupabase()
  let q = supabase.from('crm_invoices').select('*', { count: 'exact' })

  if (params?.contactId) q = q.eq('contact_id', params.contactId)
  if (params?.projectId) q = q.eq('project_id', params.projectId)
  if (params?.status) q = q.eq('status', params.status)

  q = q.order('created_at', { ascending: false })
  if (params?.limit) q = q.limit(params.limit)
  if (params?.offset) q = q.range(params.offset, params.offset + (params.limit ?? 50) - 1)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as Array<Record<string, unknown>>, total: count ?? 0 }
}

export async function getInvoiceById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_invoices').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function getInvoiceWithContact(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_invoices')
    .select(
      `
      *,
      crm_contacts (
        id, first_name, last_name, email, phone, whatsapp, company
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

  const lineItemsWithDesc = lineItems.map((i, idx) => ({
    ...i,
    description: input.line_items[idx].description,
    unit: input.line_items[idx].unit ?? 'unité',
  }))

  const supabase = getSupabase()
  const insert: Record<string, unknown> = {
    reference,
    contact_id: input.contact_id || null,
    project_id: input.project_id || null,
    devis_id: input.devis_id || null,
    line_items: lineItemsWithDesc,
    subtotal,
    tax_rate: input.tax_rate ?? 0,
    tax_amount: taxAmount,
    total,
    amount_paid: 0,
    currency: input.currency ?? 'FCFA',
    due_date: input.due_date || null,
    notes: input.notes?.trim() || null,
    internal_notes: input.internal_notes?.trim() || null,
    created_by: createdBy ?? null,
  }

  const { data, error } = await supabase.from('crm_invoices').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const invoice = data as Record<string, unknown>
  await logActivity({
    entityType: 'invoice',
    entityId: invoice.id as string,
    action: 'created',
    description: `Facture ${reference} créée`,
    createdBy: createdBy ?? undefined,
  })
  return invoice
}

export async function updateInvoice(
  id: string,
  input: UpdateInvoiceInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const existing = await getInvoiceById(id)
  if (!existing) throw new Error('Facture non trouvée')

  const update: Record<string, unknown> = {}
  if (input.status !== undefined) update.status = input.status
  if (input.contact_id !== undefined) update.contact_id = input.contact_id || null
  if (input.project_id !== undefined) update.project_id = input.project_id || null
  if (input.devis_id !== undefined) update.devis_id = input.devis_id || null
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.internal_notes !== undefined) update.internal_notes = input.internal_notes?.trim() || null
  if (input.due_date !== undefined) update.due_date = input.due_date || null
  if (input.currency !== undefined) update.currency = input.currency

  if (input.line_items && input.line_items.length > 0) {
    const { lineItems, subtotal, taxAmount, total } = computeTotals(
      input.line_items,
      input.tax_rate ?? (existing.tax_rate as number) ?? 0
    )
    update.line_items = lineItems.map((i, idx) => ({
      ...i,
      description: input.line_items![idx].description,
      unit: input.line_items![idx].unit ?? 'unité',
    }))
    update.subtotal = subtotal
    update.tax_rate = input.tax_rate ?? (existing.tax_rate as number)
    update.tax_amount = taxAmount
    update.total = total
  }

  const { data, error } = await supabase.from('crm_invoices').update(update).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  const invoice = data as Record<string, unknown>
  await logActivity({
    entityType: 'invoice',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return invoice
}

export async function markInvoiceSent(id: string, updatedBy?: string): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_invoices')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  await logActivity({
    entityType: 'invoice',
    entityId: id,
    action: 'sent',
    createdBy: updatedBy ?? undefined,
  })
  return data as Record<string, unknown>
}

export async function updateInvoiceAmountPaid(
  id: string,
  amountPaid: number,
  paidAt?: string
): Promise<void> {
  const supabase = getSupabase()
  const inv = await getInvoiceById(id)
  if (!inv) throw new Error('Facture non trouvée')
  const total = inv.total as number
  const status = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : (inv.status as string)
  await supabase
    .from('crm_invoices')
    .update({
      amount_paid: amountPaid,
      status,
      paid_at: amountPaid >= total ? (paidAt ?? new Date().toISOString()) : null,
    })
    .eq('id', id)
}

export async function setInvoicePdfUrl(id: string, pdfUrl: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('crm_invoices').update({ pdf_url: pdfUrl }).eq('id', id)
}
