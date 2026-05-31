/**
 * CRM reminder service
 */
import { eq, and, desc, asc, sql, isNull, isNotNull, inArray, ilike, or } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmReminders, crmDevis, crmInvoices, crmContacts } from '../../db/schema.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateReminderInput, UpdateReminderInput } from '../../schemas/crm/reminder.schema.js'

type ReminderStatus =
  | 'draft'
  | 'scheduled'
  | 'sent'
  | 'replied'
  | 'successful'
  | 'closed'
  | 'cancelled'

export type FollowUpSuggestion = {
  key: string
  source: 'devis' | 'invoice'
  entity_id: string
  contact_id: string
  first_name: string
  last_name: string
  company: string | null
  reference: string
  label: string
  /** Type de relance conseillé (aligné UI) */
  suggested_type: 'devis_follow_up' | 'invoice_overdue' | 'invoice_follow_up'
  invoice_id?: string
  devis_id?: string
  total_fcfa: number
}

/**
 * Devis envoyés (statut « sent ») sans conversion, et factures non soldées (sent / partial / overdue).
 */
export async function listFollowUpSuggestions(): Promise<{ suggestions: FollowUpSuggestion[] }> {
  const db = getDb()

  const [devisRows, invoiceRows] = await Promise.all([
    db
      .select({
        id: crmDevis.id,
        reference: crmDevis.reference,
        total: crmDevis.total,
        contactId: crmDevis.contactId,
        firstName: crmContacts.firstName,
        lastName: crmContacts.lastName,
        company: crmContacts.company,
        updatedAt: crmDevis.updatedAt,
      })
      .from(crmDevis)
      .innerJoin(crmContacts, eq(crmDevis.contactId, crmContacts.id))
      .where(
        and(
          eq(crmDevis.isArchived, false),
          eq(crmDevis.status, 'sent'),
          isNotNull(crmDevis.contactId),
          eq(crmContacts.isArchived, false),
        ),
      )
      .orderBy(desc(crmDevis.updatedAt))
      .limit(50),
    db
      .select({
        id: crmInvoices.id,
        reference: crmInvoices.reference,
        total: crmInvoices.total,
        status: crmInvoices.status,
        contactId: crmInvoices.contactId,
        firstName: crmContacts.firstName,
        lastName: crmContacts.lastName,
        company: crmContacts.company,
        updatedAt: crmInvoices.updatedAt,
      })
      .from(crmInvoices)
      .innerJoin(crmContacts, eq(crmInvoices.contactId, crmContacts.id))
      .where(
        and(
          eq(crmInvoices.isArchived, false),
          inArray(crmInvoices.status, ['sent', 'partial', 'overdue']),
          isNotNull(crmInvoices.contactId),
          eq(crmContacts.isArchived, false),
        ),
      )
      .orderBy(desc(crmInvoices.updatedAt))
      .limit(50),
  ])

  type Sortable = FollowUpSuggestion & { _sort: Date | null }
  const merged: Sortable[] = []

  for (const r of devisRows) {
    if (!r.contactId) continue
    merged.push({
      key: `devis:${r.id}`,
      source: 'devis',
      entity_id: r.id,
      contact_id: r.contactId,
      first_name: r.firstName,
      last_name: r.lastName,
      company: r.company,
      reference: r.reference,
      label: `Devis ${r.reference} envoyé — en attente de retour`,
      suggested_type: 'devis_follow_up',
      devis_id: r.id,
      total_fcfa: Number(r.total) ?? 0,
      _sort: r.updatedAt,
    })
  }

  for (const r of invoiceRows) {
    if (!r.contactId) continue
    const overdue = r.status === 'overdue'
    merged.push({
      key: `invoice:${r.id}`,
      source: 'invoice',
      entity_id: r.id,
      contact_id: r.contactId,
      first_name: r.firstName,
      last_name: r.lastName,
      company: r.company,
      reference: r.reference,
      label: overdue
        ? `Facture ${r.reference} — en retard`
        : `Facture ${r.reference} — solde à régler`,
      suggested_type: overdue ? 'invoice_overdue' : 'invoice_follow_up',
      invoice_id: r.id,
      total_fcfa: Number(r.total) ?? 0,
      _sort: r.updatedAt,
    })
  }

  merged.sort((a, b) => {
    const ta = a._sort ? new Date(a._sort).getTime() : 0
    const tb = b._sort ? new Date(b._sort).getTime() : 0
    return tb - ta
  })

  const suggestions: FollowUpSuggestion[] = merged.map(({ _sort: _, ...rest }) => rest)
  return { suggestions }
}

export async function countRemindersByStatus(whereClause?: ReturnType<typeof and>): Promise<Record<string, number>> {
  const db = getDb()
  const rows = await db
    .select({
      status: crmReminders.status,
      count: sql<number>`count(*)::int`,
    })
    .from(crmReminders)
    .where(whereClause)
    .groupBy(crmReminders.status)

  const out: Record<string, number> = {}
  for (const r of rows) {
    out[String(r.status)] = r.count ?? 0
  }
  return out
}

export async function listReminders(params?: {
  contactId?: string
  invoiceId?: string
  status?: ReminderStatus | ReminderStatus[]
  /** Legacy: pending = scheduled_at set and not yet sent (sent_at null) */
  legacyStatus?: 'pending'
  sort?: 'created_at' | 'updated_at' | 'scheduled_at'
  order?: 'asc' | 'desc'
  limit?: number
  offset?: number
  search?: string
}): Promise<{
  data: Array<Record<string, unknown>>
  total: number
  counts: Record<string, number>
}> {
  const db = getDb()
  const baseConditions = []
  if (params?.contactId) baseConditions.push(eq(crmReminders.contactId, params.contactId))
  if (params?.invoiceId) baseConditions.push(eq(crmReminders.invoiceId, params.invoiceId))
  const q = params?.search?.trim()
  if (q) {
    const pat = `%${q}%`
    baseConditions.push(or(ilike(crmReminders.message, pat), ilike(crmReminders.type, pat))!)
  }
  const baseWhereClause = baseConditions.length > 0 ? and(...baseConditions) : undefined

  const statusConditions = []
  if (params?.legacyStatus === 'pending') {
    statusConditions.push(isNull(crmReminders.sentAt))
    statusConditions.push(isNotNull(crmReminders.scheduledAt))
  } else if (params?.status) {
    const st = params.status
    if (Array.isArray(st)) {
      if (st.length > 0) statusConditions.push(inArray(crmReminders.status, st))
    } else {
      statusConditions.push(eq(crmReminders.status, st))
    }
  }

  const fullParts = [...baseConditions, ...statusConditions]
  const fullWhereClause = fullParts.length > 0 ? and(...fullParts) : undefined

  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const sortCol =
    params?.sort === 'updated_at'
      ? crmReminders.updatedAt
      : params?.sort === 'scheduled_at'
        ? crmReminders.scheduledAt
        : crmReminders.createdAt
  const orderFn = params?.order === 'asc' ? asc : desc

  const [rows, [{ count }], counts] = await Promise.all([
    db
      .select()
      .from(crmReminders)
      .where(fullWhereClause)
      .orderBy(orderFn(sortCol))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(crmReminders).where(fullWhereClause),
    countRemindersByStatus(baseWhereClause),
  ])

  return {
    data: rows.map((r) => toSnakeRecord(r as Record<string, unknown>)),
    total: count ?? 0,
    counts,
  }
}

export async function getReminderById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmReminders).where(eq(crmReminders.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

function initialStatus(input: CreateReminderInput): ReminderStatus {
  if (input.scheduled_at) return 'scheduled'
  return 'draft'
}

export async function createReminder(
  input: CreateReminderInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const status = initialStatus(input)
  const [reminder] = await db
    .insert(crmReminders)
    .values({
      contactId: input.contact_id,
      invoiceId: input.invoice_id || null,
      projectId: input.project_id || null,
      type: input.type.trim(),
      channel: (input.channel ?? 'both') as typeof crmReminders.channel.enumValues[number],
      message: input.message.trim(),
      scheduledAt: input.scheduled_at ? new Date(input.scheduled_at) : null,
      status,
      createdBy: createdBy ?? null,
    })
    .returning()

  if (!reminder) throw new Error('Failed to create reminder')
  return toSnakeRecord(reminder as Record<string, unknown>)
}

export async function updateReminder(
  id: string,
  input: UpdateReminderInput
): Promise<Record<string, unknown>> {
  const db = getDb()
  const existing = await getReminderById(id)
  if (!existing) throw new Error('Reminder not found')

  const update: Partial<typeof crmReminders.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (input.contact_id !== undefined) update.contactId = input.contact_id
  if (input.invoice_id !== undefined) update.invoiceId = input.invoice_id
  if (input.project_id !== undefined) update.projectId = input.project_id
  if (input.type !== undefined) update.type = input.type.trim()
  if (input.channel !== undefined)
    update.channel = input.channel as typeof crmReminders.channel.enumValues[number]
  if (input.message !== undefined) update.message = input.message.trim()
  if (input.scheduled_at !== undefined) {
    update.scheduledAt = input.scheduled_at ? new Date(input.scheduled_at) : null
  }
  if (input.status !== undefined) {
    update.status = input.status as ReminderStatus
    if (input.status === 'cancelled' || input.status === 'closed') {
      // keep sent_at as-is for history
    }
  }

  const [reminder] = await db.update(crmReminders).set(update).where(eq(crmReminders.id, id)).returning()
  if (!reminder) throw new Error('Failed to update reminder')
  return toSnakeRecord(reminder as Record<string, unknown>)
}

export async function markReminderSent(id: string): Promise<Record<string, unknown>> {
  const db = getDb()
  const [reminder] = await db
    .update(crmReminders)
    .set({
      sentAt: new Date(),
      status: 'sent',
      updatedAt: new Date(),
    })
    .where(eq(crmReminders.id, id))
    .returning()
  if (!reminder) throw new Error('Failed to update reminder')
  return toSnakeRecord(reminder as Record<string, unknown>)
}
