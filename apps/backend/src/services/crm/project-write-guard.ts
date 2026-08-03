/**
 * Verrou transversal des dossiers archivés.
 *
 * Un projet archivé est un dossier scellé : aucune mutation opérationnelle ou
 * financière rattachée n'est plus autorisée. La garde est posée au niveau
 * service — et non uniquement au niveau route — parce que des services CRM
 * s'appellent entre eux.
 *
 * Les écritures de clôture elles-mêmes passent directement par
 * `project-closure.repository.ts` (transaction verrouillée) et ne traversent
 * donc jamais cette garde.
 *
 * Exceptions volontairement non gardées :
 * - `setDevisPdfUrl`, `setInvoicePdfUrl`, `setContractPdfUrl` et
 *   `setPaymentReceiptPdfUrl` : ces écritures ne font que mémoriser le PDF
 *   généré lors d'un téléchargement. Les documents historiques doivent rester
 *   consultables et téléchargeables après archivage.
 * - contacts, organisations, services et paramètres CRM : ces entités ne sont
 *   pas rattachées à un projet.
 * - un devis, une facture, un contrat, un rappel ou un mouvement de trésorerie
 *   sans `project_id` reste modifiable : rien ne le rattache à un dossier.
 */
import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import {
  crmContracts,
  crmDeliverables,
  crmDevis,
  crmExpenses,
  crmInvoices,
  crmPayments,
  crmProjects,
  crmReminders,
  crmTasks,
  crmTreasuryMovements,
} from '../../db/schema.js'

export class ProjectArchivedError extends Error {
  readonly code = 'PROJECT_ARCHIVED'

  constructor(message = 'Ce dossier est archivé : aucune modification n’est possible.') {
    super(message)
    this.name = 'ProjectArchivedError'
  }
}

export type GuardedEntity =
  | 'devis'
  | 'invoice'
  | 'contract'
  | 'task'
  | 'deliverable'
  | 'reminder'
  | 'treasury'
  | 'payment'
  | 'expense'

export interface ProjectWriteGuardGateway {
  isProjectArchived(projectId: string): Promise<boolean>
  resolveProjectId(entity: GuardedEntity, entityId: string): Promise<string | null>
}

const databaseGateway: ProjectWriteGuardGateway = {
  async isProjectArchived(projectId) {
    const db = getDb()
    const rows = await db
      .select({ isArchived: crmProjects.isArchived })
      .from(crmProjects)
      .where(eq(crmProjects.id, projectId))
      .limit(1)
    return rows[0]?.isArchived ?? false
  },

  async resolveProjectId(entity, entityId) {
    const db = getDb()
    switch (entity) {
      case 'devis': {
        const rows = await db
          .select({ projectId: crmDevis.projectId })
          .from(crmDevis)
          .where(eq(crmDevis.id, entityId))
          .limit(1)
        return rows[0]?.projectId ?? null
      }
      case 'invoice': {
        const rows = await db
          .select({ projectId: crmInvoices.projectId })
          .from(crmInvoices)
          .where(eq(crmInvoices.id, entityId))
          .limit(1)
        return rows[0]?.projectId ?? null
      }
      case 'contract': {
        const rows = await db
          .select({ projectId: crmContracts.projectId })
          .from(crmContracts)
          .where(eq(crmContracts.id, entityId))
          .limit(1)
        return rows[0]?.projectId ?? null
      }
      case 'task': {
        const rows = await db
          .select({ projectId: crmTasks.projectId })
          .from(crmTasks)
          .where(eq(crmTasks.id, entityId))
          .limit(1)
        return rows[0]?.projectId ?? null
      }
      case 'deliverable': {
        const rows = await db
          .select({ projectId: crmDeliverables.projectId })
          .from(crmDeliverables)
          .where(eq(crmDeliverables.id, entityId))
          .limit(1)
        return rows[0]?.projectId ?? null
      }
      case 'expense': {
        const rows = await db
          .select({ projectId: crmExpenses.projectId })
          .from(crmExpenses)
          .where(eq(crmExpenses.id, entityId))
          .limit(1)
        return rows[0]?.projectId ?? null
      }
      case 'treasury': {
        const rows = await db
          .select({ projectId: crmTreasuryMovements.projectId })
          .from(crmTreasuryMovements)
          .where(eq(crmTreasuryMovements.id, entityId))
          .limit(1)
        return rows[0]?.projectId ?? null
      }
      case 'payment': {
        const rows = await db
          .select({ invoiceId: crmPayments.invoiceId })
          .from(crmPayments)
          .where(eq(crmPayments.id, entityId))
          .limit(1)
        const invoiceId = rows[0]?.invoiceId
        if (!invoiceId) return null
        return databaseGateway.resolveProjectId('invoice', invoiceId)
      }
      case 'reminder': {
        const rows = await db
          .select({ projectId: crmReminders.projectId, invoiceId: crmReminders.invoiceId })
          .from(crmReminders)
          .where(eq(crmReminders.id, entityId))
          .limit(1)
        const row = rows[0]
        if (!row) return null
        // Le lien direct prime ; sinon on remonte par la facture.
        if (row.projectId) return row.projectId
        if (row.invoiceId) return databaseGateway.resolveProjectId('invoice', row.invoiceId)
        return null
      }
    }
  },
}

let gateway: ProjectWriteGuardGateway = databaseGateway

/** Test seam. */
export function setProjectWriteGuardGateway(next: ProjectWriteGuardGateway): void {
  gateway = next
}

export function resetProjectWriteGuardGateway(): void {
  gateway = databaseGateway
}

/** Refuse toute écriture sur un projet archivé. Un projet inconnu reste permis. */
export async function assertProjectWritable(projectId: string | null | undefined): Promise<void> {
  if (!projectId) return
  if (await gateway.isProjectArchived(projectId)) throw new ProjectArchivedError()
}

/** Résout le projet parent d'une entité puis applique la garde. */
export async function assertEntityProjectWritable(
  entity: GuardedEntity,
  entityId: string | null | undefined,
): Promise<void> {
  if (!entityId) return
  const projectId = await gateway.resolveProjectId(entity, entityId)
  await assertProjectWritable(projectId)
}

/** Raccourci le plus fréquent : un paiement, un rappel ou un reçu de facture. */
export async function assertInvoiceProjectWritable(
  invoiceId: string | null | undefined,
): Promise<void> {
  await assertEntityProjectWritable('invoice', invoiceId)
}

export class ProjectClosureRequiredError extends Error {
  readonly code = 'PROJECT_CLOSURE_REQUIRED'

  constructor(message = 'Utilisez l’assistant Clore et archiver le dossier.') {
    super(message)
    this.name = 'ProjectClosureRequiredError'
  }
}

/**
 * Traduit les erreurs de garde en réponses HTTP. Enregistré sur le routeur CRM
 * racine : Hono ne consulte que le gestionnaire d'erreur le plus externe.
 */
export function crmErrorHandler(error: Error, c: Context) {
  if (error instanceof ProjectArchivedError) {
    return c.json({ error: error.code, message: error.message }, 409)
  }
  if (error instanceof ProjectClosureRequiredError) {
    return c.json({ error: error.code, message: error.message }, 409)
  }
  throw error
}
