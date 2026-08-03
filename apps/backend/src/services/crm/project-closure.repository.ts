/**
 * CRM project closure — persistence layer.
 *
 * Every read is bounded: one query per entity family, never one query per row.
 * The transactional writes live here so the service stays free of Drizzle
 * details and can be exercised with a fake repository.
 */
import { and, eq, inArray, sql } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import {
  crmActivityLog,
  crmContracts,
  crmDeliverables,
  crmDevis,
  crmExpenses,
  crmInvoiceAdjustments,
  crmInvoices,
  crmPayments,
  crmProjectClosureItems,
  crmProjectClosureOperations,
  crmProjects,
  crmReminders,
  crmTasks,
  crmTreasuryMovements,
} from '../../db/schema.js'
import { toSnakeRecord } from './crm-util.js'
import { nextReference } from '../../lib/reference.js'
import type { ArchiveReconciliationRow, ClosureSnapshot } from './project-closure.types.js'

type Db = ReturnType<typeof getDb>
/** Drizzle transaction handle; structurally compatible with the db handle. */
export type DbHandle = Db | Parameters<Parameters<Db['transaction']>[0]>[0]

function iso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined
  return value instanceof Date ? value.toISOString() : String(value)
}

/**
 * Load the whole project folder in a bounded set of queries.
 * Passing a transaction handle keeps the reload inside the closure lock.
 */
export async function loadClosureSnapshot(
  projectId: string,
  handle?: DbHandle,
): Promise<ClosureSnapshot | null> {
  const db = handle ?? getDb()

  const projectRows = await db
    .select()
    .from(crmProjects)
    .where(eq(crmProjects.id, projectId))
    .limit(1)
  const project = projectRows[0]
  if (!project) return null

  const [devisRows, invoiceRows, contractRows, taskRows, reminderRows, deliverableRows, expenseRows, treasuryRows] =
    await Promise.all([
      db.select().from(crmDevis).where(eq(crmDevis.projectId, projectId)),
      db.select().from(crmInvoices).where(eq(crmInvoices.projectId, projectId)),
      db.select().from(crmContracts).where(eq(crmContracts.projectId, projectId)),
      db.select().from(crmTasks).where(eq(crmTasks.projectId, projectId)),
      db.select().from(crmReminders).where(eq(crmReminders.projectId, projectId)),
      db.select().from(crmDeliverables).where(eq(crmDeliverables.projectId, projectId)),
      db.select().from(crmExpenses).where(eq(crmExpenses.projectId, projectId)),
      db.select().from(crmTreasuryMovements).where(eq(crmTreasuryMovements.projectId, projectId)),
    ])

  const invoiceIds = invoiceRows.map((invoice) => invoice.id)
  const paymentRows = invoiceIds.length
    ? await db.select().from(crmPayments).where(inArray(crmPayments.invoiceId, invoiceIds))
    : []

  const byId = <T extends { id: string }>(rows: T[]): T[] =>
    [...rows].sort((left, right) => left.id.localeCompare(right.id))

  return {
    project: {
      id: project.id,
      reference: project.reference,
      closureVersion: project.closureVersion ?? 0,
      isArchived: project.isArchived,
    },
    devis: byId(devisRows).map((row) => ({
      id: row.id,
      reference: row.reference,
      status: row.status,
      isArchived: row.isArchived,
      updatedAt: iso(row.updatedAt),
    })),
    invoices: byId(invoiceRows).map((row) => ({
      id: row.id,
      reference: row.reference,
      status: row.status,
      isArchived: row.isArchived,
      total: row.total,
      amountPaid: row.amountPaid,
      currency: row.currency,
      updatedAt: iso(row.updatedAt),
    })),
    contracts: byId(contractRows).map((row) => ({
      id: row.id,
      reference: row.reference,
      status: row.status,
      isArchived: row.isArchived,
      updatedAt: iso(row.updatedAt),
    })),
    payments: byId(paymentRows).map((row) => ({
      id: row.id,
      invoiceId: row.invoiceId,
      amount: row.amount,
      paidAt: iso(row.paidAt) ?? '',
    })),
    // Les reçus ne sont pas une table dédiée : un paiement dispose d'un reçu
    // dès qu'un PDF a été généré.
    receipts: byId(paymentRows)
      .filter((row) => Boolean(row.receiptPdfUrl))
      .map((row) => ({ id: row.id, paymentId: row.id })),
    tasks: byId(taskRows).map((row) => ({ id: row.id, status: row.status })),
    reminders: byId(reminderRows).map((row) => ({
      id: row.id,
      status: row.status,
      scheduledAt: iso(row.scheduledAt),
    })),
    deliverables: byId(deliverableRows).map((row) => ({ id: row.id })),
    expenses: byId(expenseRows).map((row) => ({ id: row.id, amount: row.amount })),
    treasuryMovements: byId(treasuryRows).map((row) => ({ id: row.id, amount: row.amount })),
  }
}

/** True when the archive predates the closure lifecycle (no completed operation). */
export async function hasCompletedClosure(
  projectId: string,
  handle?: DbHandle,
): Promise<boolean> {
  const db = handle ?? getDb()
  const rows = await db
    .select({ id: crmProjectClosureOperations.id })
    .from(crmProjectClosureOperations)
    .where(
      and(
        eq(crmProjectClosureOperations.projectId, projectId),
        eq(crmProjectClosureOperations.status, 'completed'),
      ),
    )
    .limit(1)
  return rows.length > 0
}

export interface ClosureOperationRecord {
  id: string
  projectId: string
  idempotencyKey: string
  requestHash: string
  status: 'completed' | 'reversed'
  summary: Record<string, unknown>
}

export async function findOperationByIdempotencyKey(
  idempotencyKey: string,
  handle?: DbHandle,
): Promise<ClosureOperationRecord | null> {
  const db = handle ?? getDb()
  const rows = await db
    .select()
    .from(crmProjectClosureOperations)
    .where(eq(crmProjectClosureOperations.idempotencyKey, idempotencyKey))
    .limit(1)
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    projectId: row.projectId,
    idempotencyKey: row.idempotencyKey,
    requestHash: row.requestHash,
    status: row.status,
    summary: (row.summary ?? {}) as Record<string, unknown>,
  }
}

/** Latest completed closure operation for a project, if any. */
export async function findLatestCompletedOperation(
  projectId: string,
  handle?: DbHandle,
): Promise<ClosureOperationRecord | null> {
  const db = handle ?? getDb()
  const rows = await db
    .select()
    .from(crmProjectClosureOperations)
    .where(
      and(
        eq(crmProjectClosureOperations.projectId, projectId),
        eq(crmProjectClosureOperations.status, 'completed'),
      ),
    )
    .orderBy(sql`${crmProjectClosureOperations.createdAt} DESC`)
    .limit(1)
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    projectId: row.projectId,
    idempotencyKey: row.idempotencyKey,
    requestHash: row.requestHash,
    status: row.status,
    summary: (row.summary ?? {}) as Record<string, unknown>,
  }
}

export interface ClosureCommit {
  projectId: string
  idempotencyKey: string
  requestHash: string
  closureType: 'completed' | 'client_abandoned' | 'mutual_termination' | 'company_cancelled'
  reason: string
  previewFingerprint: string
  actorId: string
  summary: Record<string, unknown>
  invoiceAdjustments: Array<{
    invoiceId: string
    projectId: string
    type: 'credit_note' | 'bad_debt'
    amount: number
    currency: string
    reason: string
    externalReference?: string
    evidenceUrl?: string
    managerAttestation: boolean
    closureResolution: 'credit_note' | 'bad_debt' | 'mixed'
  }>
  archiveDevisIds: string[]
  archiveInvoiceIds: string[]
  archiveContractIds: string[]
  cancelDraftInvoiceIds: string[]
  cancelTaskIds: string[]
  cancelReminderIds: string[]
  preserved: Array<{ entityType: string; entityId: string }>
  nextClosureVersion: number
}

/**
 * Open one transaction and take the project lock before anything else runs.
 * Every read and write performed by `fn` uses the returned handle, so the
 * snapshot the closure validates is the snapshot it commits.
 */
export async function withProjectLock<T>(
  projectId: string,
  fn: (handle: DbHandle) => Promise<T>,
): Promise<T> {
  const db = getDb()
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM crm_projects WHERE id = ${projectId} FOR UPDATE`)
    return fn(tx)
  })
}

/** Write a closure. Must run inside `withProjectLock`. */
export async function persistClosure(commit: ClosureCommit, handle: DbHandle): Promise<string> {
  const tx = handle
  {
    const [operation] = await tx
      .insert(crmProjectClosureOperations)
      .values({
        projectId: commit.projectId,
        idempotencyKey: commit.idempotencyKey,
        requestHash: commit.requestHash,
        closureType: commit.closureType,
        reason: commit.reason,
        previewFingerprint: commit.previewFingerprint,
        status: 'completed',
        summary: commit.summary,
        createdBy: commit.actorId,
      })
      .returning({ id: crmProjectClosureOperations.id })
    if (!operation) throw new Error('Failed to create closure operation')
    const operationId = operation.id
    const now = new Date()
    const items: Array<typeof crmProjectClosureItems.$inferInsert> = []

    for (const adjustment of commit.invoiceAdjustments) {
      const [row] = await tx
        .insert(crmInvoiceAdjustments)
        .values({
          invoiceId: adjustment.invoiceId,
          projectId: adjustment.projectId,
          closureOperationId: operationId,
          type: adjustment.type,
          amount: adjustment.amount,
          currency: adjustment.currency,
          reason: adjustment.reason,
          externalReference: adjustment.externalReference ?? null,
          evidenceUrl: adjustment.evidenceUrl ?? null,
          managerAttestation: adjustment.managerAttestation,
          effectiveAt: now,
          createdBy: commit.actorId,
        })
        .returning({ id: crmInvoiceAdjustments.id })
      items.push({
        operationId,
        entityType: 'invoice_adjustment',
        entityId: row?.id ?? adjustment.invoiceId,
        action: adjustment.type,
        resultState: { invoice_id: adjustment.invoiceId, amount: adjustment.amount },
      })
      await tx
        .update(crmInvoices)
        .set({
          closureResolution: adjustment.closureResolution,
          closureResolvedAt: now,
          closureResolvedBy: commit.actorId,
        })
        .where(eq(crmInvoices.id, adjustment.invoiceId))
    }

    if (commit.cancelDraftInvoiceIds.length) {
      await tx
        .update(crmInvoices)
        .set({ status: 'cancelled', updatedAt: now })
        .where(inArray(crmInvoices.id, commit.cancelDraftInvoiceIds))
      for (const entityId of commit.cancelDraftInvoiceIds) {
        items.push({ operationId, entityType: 'invoice', entityId, action: 'cancelled' })
      }
    }

    const archiveMetadata = {
      isArchived: true,
      archivedAt: now,
      archivedBy: commit.actorId,
      archiveReason: commit.reason,
      archiveOperationId: operationId,
    }

    if (commit.archiveDevisIds.length) {
      await tx
        .update(crmDevis)
        .set(archiveMetadata)
        .where(inArray(crmDevis.id, commit.archiveDevisIds))
      for (const entityId of commit.archiveDevisIds) {
        items.push({ operationId, entityType: 'devis', entityId, action: 'archived' })
      }
    }
    if (commit.archiveInvoiceIds.length) {
      await tx
        .update(crmInvoices)
        .set(archiveMetadata)
        .where(inArray(crmInvoices.id, commit.archiveInvoiceIds))
      for (const entityId of commit.archiveInvoiceIds) {
        items.push({ operationId, entityType: 'invoice', entityId, action: 'archived' })
      }
    }
    if (commit.archiveContractIds.length) {
      await tx
        .update(crmContracts)
        .set(archiveMetadata)
        .where(inArray(crmContracts.id, commit.archiveContractIds))
      for (const entityId of commit.archiveContractIds) {
        items.push({ operationId, entityType: 'contract', entityId, action: 'archived' })
      }
    }

    if (commit.cancelTaskIds.length) {
      await tx
        .update(crmTasks)
        .set({ status: 'cancelled', updatedAt: now })
        .where(inArray(crmTasks.id, commit.cancelTaskIds))
      for (const entityId of commit.cancelTaskIds) {
        items.push({ operationId, entityType: 'task', entityId, action: 'cancelled' })
      }
    }
    if (commit.cancelReminderIds.length) {
      await tx
        .update(crmReminders)
        .set({ status: 'cancelled', updatedAt: now })
        .where(inArray(crmReminders.id, commit.cancelReminderIds))
      for (const entityId of commit.cancelReminderIds) {
        items.push({ operationId, entityType: 'reminder', entityId, action: 'cancelled' })
      }
    }

    for (const entity of commit.preserved) {
      items.push({
        operationId,
        entityType: entity.entityType,
        entityId: entity.entityId,
        action: 'preserved',
      })
    }

    if (items.length) {
      await tx.insert(crmProjectClosureItems).values(items)
    }

    await tx
      .update(crmProjects)
      .set({
        isArchived: true,
        archivedAt: now,
        archivedBy: commit.actorId,
        archiveReason: commit.reason,
        archiveOperationId: operationId,
        closureType: commit.closureType,
        closureReason: commit.reason,
        closedBy: commit.actorId,
        closureVersion: commit.nextClosureVersion,
        status: 'closed',
        closedAt: now,
      })
      .where(eq(crmProjects.id, commit.projectId))

    // Journalisé dans la même transaction : logActivity() écrit hors transaction.
    await tx.insert(crmActivityLog).values({
      entityType: 'project',
      entityId: commit.projectId,
      action: 'closed_and_archived',
      description: `Dossier clôturé (${commit.closureType})`,
      metadata: { operation_id: operationId, ...commit.summary },
      createdBy: commit.actorId,
    })

    return operationId
  }
}

/**
 * Reverse a closure operation, replaying only the items it created.
 * Entities archived independently before the closure stay archived.
 * Must run inside `withProjectLock`.
 */
export async function persistRestore(
  params: {
    projectId: string
    operationId: string
    actorId: string
  },
  handle: DbHandle,
): Promise<number> {
  const tx = handle
  {
    const items = await tx
      .select()
      .from(crmProjectClosureItems)
      .where(eq(crmProjectClosureItems.operationId, params.operationId))

    const now = new Date()
    const clearArchive = {
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
      archiveOperationId: null,
    }
    const idsFor = (entityType: string, action: string) =>
      items
        .filter((item) => item.entityType === entityType && item.action === action)
        .map((item) => item.entityId)

    const devisIds = idsFor('devis', 'archived')
    if (devisIds.length) {
      await tx.update(crmDevis).set(clearArchive).where(inArray(crmDevis.id, devisIds))
    }
    const invoiceIds = idsFor('invoice', 'archived')
    if (invoiceIds.length) {
      await tx.update(crmInvoices).set(clearArchive).where(inArray(crmInvoices.id, invoiceIds))
    }
    const cancelledInvoiceIds = idsFor('invoice', 'cancelled')
    if (cancelledInvoiceIds.length) {
      await tx
        .update(crmInvoices)
        .set({ status: 'draft', updatedAt: now })
        .where(inArray(crmInvoices.id, cancelledInvoiceIds))
    }
    const contractIds = idsFor('contract', 'archived')
    if (contractIds.length) {
      await tx.update(crmContracts).set(clearArchive).where(inArray(crmContracts.id, contractIds))
    }
    const taskIds = idsFor('task', 'cancelled')
    if (taskIds.length) {
      await tx
        .update(crmTasks)
        .set({ status: 'todo', updatedAt: now })
        .where(inArray(crmTasks.id, taskIds))
    }
    const reminderIds = idsFor('reminder', 'cancelled')
    if (reminderIds.length) {
      await tx
        .update(crmReminders)
        .set({ status: 'scheduled', updatedAt: now })
        .where(inArray(crmReminders.id, reminderIds))
    }

    await tx
      .update(crmProjectClosureOperations)
      .set({ status: 'reversed', reversedBy: params.actorId, reversedAt: now })
      .where(eq(crmProjectClosureOperations.id, params.operationId))

    await tx
      .update(crmProjects)
      .set({
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
        archiveReason: null,
        archiveOperationId: null,
        closureType: null,
        closureReason: null,
        closedBy: null,
        closedAt: null,
        status: 'in_progress',
        closureVersion: sql`${crmProjects.closureVersion} + 1`,
      })
      .where(eq(crmProjects.id, params.projectId))

    await tx.insert(crmActivityLog).values({
      entityType: 'project',
      entityId: params.projectId,
      action: 'closure_reversed',
      description: 'Clôture annulée',
      metadata: { operation_id: params.operationId },
      createdBy: params.actorId,
    })

    return (
      devisIds.length +
      invoiceIds.length +
      contractIds.length +
      taskIds.length +
      reminderIds.length
    )
  }
}

/**
 * Archived projects with no completed closure operation: legacy archives that
 * must be regularized explicitly.
 */
export async function listLegacyArchives(): Promise<ArchiveReconciliationRow[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: crmProjects.id,
      reference: crmProjects.reference,
      title: crmProjects.title,
      archivedAt: crmProjects.archivedAt,
      archiveReason: crmProjects.archiveReason,
    })
    .from(crmProjects)
    .where(
      and(
        eq(crmProjects.isArchived, true),
        sql`NOT EXISTS (
          SELECT 1 FROM crm_project_closure_operations
          WHERE project_id = ${crmProjects.id} AND status = 'completed'
        )`,
      ),
    )
    .orderBy(sql`${crmProjects.archivedAt} DESC NULLS LAST`)

  if (!rows.length) return []
  const projectIds = rows.map((row) => row.id)

  const [devisCounts, invoiceRows, contractCounts, taskCounts, reminderCounts] = await Promise.all([
    db
      .select({ projectId: crmDevis.projectId, count: sql<number>`count(*)::int` })
      .from(crmDevis)
      .where(inArray(crmDevis.projectId, projectIds))
      .groupBy(crmDevis.projectId),
    db
      .select({
        projectId: crmInvoices.projectId,
        status: crmInvoices.status,
        total: crmInvoices.total,
        amountPaid: crmInvoices.amountPaid,
      })
      .from(crmInvoices)
      .where(inArray(crmInvoices.projectId, projectIds)),
    db
      .select({ projectId: crmContracts.projectId, count: sql<number>`count(*)::int` })
      .from(crmContracts)
      .where(inArray(crmContracts.projectId, projectIds))
      .groupBy(crmContracts.projectId),
    db
      .select({ projectId: crmTasks.projectId, count: sql<number>`count(*)::int` })
      .from(crmTasks)
      .where(inArray(crmTasks.projectId, projectIds))
      .groupBy(crmTasks.projectId),
    db
      .select({ projectId: crmReminders.projectId, count: sql<number>`count(*)::int` })
      .from(crmReminders)
      .where(inArray(crmReminders.projectId, projectIds))
      .groupBy(crmReminders.projectId),
  ])

  const toMap = (entries: Array<{ projectId: string | null; count: number }>) =>
    new Map(entries.filter((entry) => entry.projectId).map((entry) => [entry.projectId as string, entry.count]))
  const devisMap = toMap(devisCounts)
  const contractMap = toMap(contractCounts)
  const taskMap = toMap(taskCounts)
  const reminderMap = toMap(reminderCounts)

  const invoiceMap = new Map<string, { count: number; unresolved: number }>()
  for (const invoice of invoiceRows) {
    if (!invoice.projectId) continue
    const entry = invoiceMap.get(invoice.projectId) ?? { count: 0, unresolved: 0 }
    entry.count += 1
    if (!['draft', 'paid', 'cancelled'].includes(invoice.status)) {
      entry.unresolved += Math.max(0, invoice.total - invoice.amountPaid)
    }
    invoiceMap.set(invoice.projectId, entry)
  }

  return rows.map((row) => ({
    projectId: row.id,
    reference: row.reference,
    title: row.title,
    archivedAt: iso(row.archivedAt) ?? null,
    archiveReason: row.archiveReason ?? null,
    counts: {
      devis: devisMap.get(row.id) ?? 0,
      invoices: invoiceMap.get(row.id)?.count ?? 0,
      contracts: contractMap.get(row.id) ?? 0,
      tasks: taskMap.get(row.id) ?? 0,
      reminders: reminderMap.get(row.id) ?? 0,
    },
    unresolvedInvoiceTotal: invoiceMap.get(row.id)?.unresolved ?? 0,
  }))
}

/** Count of irreversible financial adjustments attached to a closure. */
export async function countAdjustmentsForOperation(
  operationId: string,
  handle?: DbHandle,
): Promise<number> {
  const db = handle ?? getDb()
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(crmInvoiceAdjustments)
    .where(eq(crmInvoiceAdjustments.closureOperationId, operationId))
  return rows[0]?.count ?? 0
}

/**
 * Create a fresh project linked to a sealed archive. Only descriptive context
 * is copied; no document and no financial record follows.
 */
export async function createFollowUp(params: {
  archivedProjectId: string
  actorId: string
}): Promise<Record<string, unknown>> {
  const db = getDb()
  const rows = await db
    .select()
    .from(crmProjects)
    .where(eq(crmProjects.id, params.archivedProjectId))
    .limit(1)
  const source = rows[0]
  if (!source) throw new Error('Failed to load predecessor project')

  const reference = await nextReference('PRJ')
  const [project] = await db
    .insert(crmProjects)
    .values({
      reference,
      title: source.title,
      contactId: source.contactId,
      organizationId: source.organizationId,
      serviceSlug: source.serviceSlug,
      description: source.description,
      objectives: source.objectives,
      deliverablesSummary: source.deliverablesSummary,
      currency: source.currency,
      assignedTo: source.assignedTo,
      predecessorProjectId: source.id,
      status: 'draft',
      createdBy: params.actorId,
    })
    .returning()
  if (!project) throw new Error('Failed to create follow-up project')

  await db.insert(crmActivityLog).values({
    entityType: 'project',
    entityId: project.id,
    action: 'created',
    description: `Projet ${reference} créé à la suite de ${source.reference}`,
    metadata: { predecessor_project_id: source.id },
    createdBy: params.actorId,
  })

  return toSnakeRecord(project as Record<string, unknown>)
}
