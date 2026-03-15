/**
 * CRM project service
 */
import { eq, and, desc, sql } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmProjects, crmProjectContacts, crmContacts, devisRequests } from '../../db/schema.js'
import { nextReference } from '../../lib/reference.js'
import { logActivity } from './activity.service.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateProjectInput, UpdateProjectInput } from '../../schemas/crm/project.schema.js'
import * as devisService from './devis.service.js'
import * as invoiceService from './invoice.service.js'
import * as paymentService from './payment.service.js'
import * as expenseService from './expense.service.js'

export async function listProjects(params?: {
  contactId?: string
  status?: string
  limit?: number
  offset?: number
  withContact?: boolean
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const db = getDb()
  const conditions = []
  if (params?.contactId) conditions.push(eq(crmProjects.contactId, params.contactId))
  if (params?.status) conditions.push(eq(crmProjects.status, params.status as typeof crmProjects.status.enumValues[number]))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  if (params?.withContact) {
    const [rows, [{ count }]] = await Promise.all([
      db
        .select({
          project: crmProjects,
          contact: {
            firstName: crmContacts.firstName,
            lastName: crmContacts.lastName,
          },
        })
        .from(crmProjects)
        .leftJoin(crmContacts, eq(crmProjects.contactId, crmContacts.id))
        .where(whereClause)
        .orderBy(desc(crmProjects.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(crmProjects)
        .where(whereClause),
    ])
    const data = rows.map((r) => {
      const rec = toSnakeRecord(r.project as Record<string, unknown>) as Record<string, unknown>
      if (r.contact?.firstName != null || r.contact?.lastName != null) {
        rec.crm_contacts = toSnakeRecord(r.contact as Record<string, unknown>)
      }
      return rec
    })
    return { data, total: count ?? 0 }
  }

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(crmProjects)
      .where(whereClause)
      .orderBy(desc(crmProjects.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmProjects)
      .where(whereClause),
  ])
  return {
    data: rows.map((r) => toSnakeRecord(r as Record<string, unknown>)),
    total: count ?? 0,
  }
}

export async function getProjectById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmProjects).where(eq(crmProjects.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

/**
 * Get full project folder: project + devis + invoices (with payments) + contacts + devis_request + expenses.
 * All necessary information for the project view in one call.
 */
export async function getProjectFolder(id: string): Promise<Record<string, unknown> | null> {
  const project = await getProjectById(id)
  if (!project) return null

  const [devisRes, invoicesRes, contacts, expenses] = await Promise.all([
    project.devis_id
      ? devisService.getDevisById(project.devis_id as string)
      : Promise.resolve(null),
    invoiceService.listInvoices({ projectId: id, limit: 100 }),
    getProjectContacts(id),
    expenseService.listExpensesByProject(id),
  ])

  let devis = devisRes
  if (!devis && !project.devis_id) {
    try {
      const byProject = await devisService.listDevis({ projectId: id, limit: 1 })
      devis = byProject.data[0] ?? null
    } catch {
      devis = null
    }
  }

  const invoices = invoicesRes.data ?? []
  const invoicesWithPayments = await Promise.all(
    invoices.map(async (inv) => {
      const payments = await paymentService.listPaymentsByInvoice(inv.id as string)
      return { ...inv, payments }
    })
  )

  let devisRequest: Record<string, unknown> | null = null
  if (devis?.devis_request_id) {
    const db = getDb()
    const rows = await db
      .select()
      .from(devisRequests)
      .where(eq(devisRequests.id, devis.devis_request_id as string))
      .limit(1)
    devisRequest = rows[0] ? toSnakeRecord(rows[0] as Record<string, unknown>) : null
  }

  return {
    project,
    devis,
    invoices: invoicesWithPayments,
    contacts,
    devis_request: devisRequest,
    expenses,
  }
}

export async function createProject(
  input: CreateProjectInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const reference = await nextReference('PRJ')
  const db = getDb()

  const [project] = await db
    .insert(crmProjects)
    .values({
      reference,
      title: input.title.trim(),
      contactId: input.contact_id || null,
      organizationId: input.organization_id || null,
      devisId: input.devis_id || null,
      serviceSlug: input.service_slug?.trim() || null,
      description: input.description?.trim() || null,
      objectives: input.objectives?.trim() || null,
      deliverablesSummary: input.deliverables_summary?.trim() || null,
      startDate: input.start_date || null,
      endDate: input.end_date || null,
      budgetAgreed: input.budget_agreed ?? null,
      currency: input.currency ?? 'FCFA',
      notes: input.notes?.trim() || null,
      internalNotes: input.internal_notes?.trim() || null,
      assignedTo: input.assigned_to || null,
      createdBy: createdBy ?? null,
    })
    .returning()

  if (!project) throw new Error('Failed to create project')

  if (input.devis_id) {
    const devis = await devisService.getDevisById(input.devis_id)
    if (devis?.devis_request_id) {
      const db = getDb()
      await db
        .update(devisRequests)
        .set({ convertedToProjectId: project.id })
        .where(eq(devisRequests.id, devis.devis_request_id as string))
    }
  }

  await logActivity({
    entityType: 'project',
    entityId: project.id,
    action: 'created',
    description: `Projet ${reference} créé`,
    createdBy: createdBy ?? undefined,
  })
  return toSnakeRecord(project as Record<string, unknown>)
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const update: Partial<typeof crmProjects.$inferInsert> = {}
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.contact_id !== undefined) update.contactId = input.contact_id || null
  if (input.organization_id !== undefined) update.organizationId = input.organization_id || null
  if (input.devis_id !== undefined) update.devisId = input.devis_id || null
  if (input.service_slug !== undefined) update.serviceSlug = input.service_slug?.trim() || null
  if (input.status !== undefined) update.status = input.status as typeof crmProjects.status.enumValues[number]
  if (input.description !== undefined) update.description = input.description?.trim() || null
  if (input.objectives !== undefined) update.objectives = input.objectives?.trim() || null
  if (input.deliverables_summary !== undefined)
    update.deliverablesSummary = input.deliverables_summary?.trim() || null
  if (input.start_date !== undefined) update.startDate = input.start_date || null
  if (input.end_date !== undefined) update.endDate = input.end_date || null
  if (input.budget_agreed !== undefined) update.budgetAgreed = input.budget_agreed ?? null
  if (input.currency !== undefined) update.currency = input.currency
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.internal_notes !== undefined) update.internalNotes = input.internal_notes?.trim() || null
  if (input.assigned_to !== undefined) update.assignedTo = input.assigned_to || null

  const [project] = await db.update(crmProjects).set(update).where(eq(crmProjects.id, id)).returning()
  if (!project) throw new Error('Failed to update project')
  await logActivity({
    entityType: 'project',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return toSnakeRecord(project as Record<string, unknown>)
}

// ── Project Contacts (many-to-many) ──────────────────────────────────

export async function getProjectContacts(projectId: string): Promise<Array<Record<string, unknown>>> {
  const db = getDb()
  const rows = await db
    .select({
      link: crmProjectContacts,
      contact: {
        id: crmContacts.id,
        firstName: crmContacts.firstName,
        lastName: crmContacts.lastName,
        email: crmContacts.email,
        company: crmContacts.company,
        type: crmContacts.type,
      },
    })
    .from(crmProjectContacts)
    .leftJoin(crmContacts, eq(crmProjectContacts.contactId, crmContacts.id))
    .where(eq(crmProjectContacts.projectId, projectId))
    .orderBy(desc(crmProjectContacts.isPrimary))

  return rows.map((r) => {
    const linkRec = toSnakeRecord(r.link as Record<string, unknown>) as Record<string, unknown>
    if (r.contact?.id) {
      linkRec.contact = toSnakeRecord(r.contact as Record<string, unknown>)
    }
    return linkRec
  })
}

export async function addProjectContact(
  projectId: string,
  contactId: string,
  role: string = 'client',
  isPrimary: boolean = false
): Promise<Record<string, unknown>> {
  const db = getDb()
  if (isPrimary) {
    await db
      .update(crmProjectContacts)
      .set({ isPrimary: false })
      .where(and(eq(crmProjectContacts.projectId, projectId), eq(crmProjectContacts.isPrimary, true)))
  }
  const [link] = await db
    .insert(crmProjectContacts)
    .values({
      projectId,
      contactId,
      role,
      isPrimary,
    })
    .onConflictDoUpdate({
      target: [crmProjectContacts.projectId, crmProjectContacts.contactId],
      set: { role, isPrimary },
    })
    .returning()

  if (!link) throw new Error('Failed to add project contact')
  return toSnakeRecord(link as Record<string, unknown>)
}

export async function removeProjectContact(projectId: string, contactId: string): Promise<void> {
  const db = getDb()
  await db
    .delete(crmProjectContacts)
    .where(and(eq(crmProjectContacts.projectId, projectId), eq(crmProjectContacts.contactId, contactId)))
}

export async function closeProject(id: string, closedBy?: string): Promise<Record<string, unknown>> {
  const db = getDb()
  const [project] = await db
    .update(crmProjects)
    .set({ status: 'closed', closedAt: new Date() })
    .where(eq(crmProjects.id, id))
    .returning()
  if (!project) throw new Error('Failed to close project')
  await logActivity({
    entityType: 'project',
    entityId: id,
    action: 'closed',
    createdBy: closedBy ?? undefined,
  })
  return toSnakeRecord(project as Record<string, unknown>)
}
