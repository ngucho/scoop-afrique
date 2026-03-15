/**
 * CRM devis (quote) service
 */
import { getSupabase } from '../../lib/supabase.js'
import { nextReference } from '../../lib/reference.js'
import { logActivity } from './activity.service.js'
import { computeLineItems } from './line-items.util.js'
import type { CreateDevisInput, UpdateDevisInput } from '../../schemas/crm/devis.schema.js'

export async function listDevis(params?: {
  contactId?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const supabase = getSupabase()
  let q = supabase.from('crm_devis').select('*', { count: 'exact' })

  if (params?.contactId) q = q.eq('contact_id', params.contactId)
  if (params?.status) q = q.eq('status', params.status)

  q = q.order('created_at', { ascending: false })
  if (params?.limit) q = q.limit(params.limit)
  if (params?.offset) q = q.range(params.offset, params.offset + (params.limit ?? 50) - 1)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as Array<Record<string, unknown>>, total: count ?? 0 }
}

export async function getDevisById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_devis').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function getDevisWithContact(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_devis')
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

export async function createDevis(
  input: CreateDevisInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const reference = await nextReference('DV')
  const { lineItems, subtotal, taxAmount, total } = computeTotals(input.line_items, input.tax_rate ?? 0)

  const supabase = getSupabase()
  const lineItemsWithDesc = lineItems.map((i, idx) => ({
    ...i,
    description: input.line_items[idx].description,
    unit: input.line_items[idx].unit ?? 'unité',
  }))

  const insert: Record<string, unknown> = {
    reference,
    contact_id: input.contact_id || null,
    devis_request_id: input.devis_request_id || null,
    service_slug: input.service_slug?.trim() || null,
    title: input.title.trim(),
    line_items: lineItemsWithDesc,
    subtotal,
    tax_rate: input.tax_rate ?? 0,
    tax_amount: taxAmount,
    total,
    currency: input.currency ?? 'FCFA',
    valid_until: input.valid_until || null,
    notes: input.notes?.trim() || null,
    internal_notes: input.internal_notes?.trim() || null,
    created_by: createdBy ?? null,
  }

  const { data, error } = await supabase.from('crm_devis').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const devis = data as Record<string, unknown>
  await logActivity({
    entityType: 'devis',
    entityId: devis.id as string,
    action: 'created',
    description: `Devis ${reference} créé`,
    createdBy: createdBy ?? undefined,
  })
  return devis
}

export async function updateDevis(
  id: string,
  input: UpdateDevisInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const existing = await getDevisById(id)
  if (!existing) throw new Error('Devis non trouvé')

  const update: Record<string, unknown> = {}
  if (input.status !== undefined) update.status = input.status
  if (input.contact_id !== undefined) update.contact_id = input.contact_id || null
  if (input.devis_request_id !== undefined) update.devis_request_id = input.devis_request_id || null
  if (input.service_slug !== undefined) update.service_slug = input.service_slug?.trim() || null
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.internal_notes !== undefined) update.internal_notes = input.internal_notes?.trim() || null
  if (input.valid_until !== undefined) update.valid_until = input.valid_until || null
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

  const { data, error } = await supabase.from('crm_devis').update(update).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  const devis = data as Record<string, unknown>
  await logActivity({
    entityType: 'devis',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return devis
}

export async function markDevisSent(id: string, updatedBy?: string): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_devis')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  await logActivity({
    entityType: 'devis',
    entityId: id,
    action: 'sent',
    createdBy: updatedBy ?? undefined,
  })
  return data as Record<string, unknown>
}

export async function markDevisAccepted(id: string, updatedBy?: string): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_devis')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  await logActivity({
    entityType: 'devis',
    entityId: id,
    action: 'accepted',
    createdBy: updatedBy ?? undefined,
  })
  return data as Record<string, unknown>
}

export async function setDevisPdfUrl(id: string, pdfUrl: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('crm_devis').update({ pdf_url: pdfUrl }).eq('id', id)
}
