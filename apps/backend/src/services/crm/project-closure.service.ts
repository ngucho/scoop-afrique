/**
 * CRM project closure — orchestration.
 *
 * The service owns the business flow; the pure domain lives in
 * `project-closure.policy.ts` and every database access goes through
 * `project-closure.repository.ts` (swappable for tests).
 */
import { createHash } from 'node:crypto'
import { buildClosurePlan, buildClosurePreview, ClosurePolicyError } from './project-closure.policy.js'
import * as defaultRepository from './project-closure.repository.js'
import type {
  ArchiveReconciliationRow,
  CloseProjectInput,
  ClosurePreview,
  ClosureResult,
  RestoreResult,
} from './project-closure.types.js'

export interface ClosureRepository {
  withProjectLock: typeof defaultRepository.withProjectLock
  loadClosureSnapshot: typeof defaultRepository.loadClosureSnapshot
  hasCompletedClosure: typeof defaultRepository.hasCompletedClosure
  findOperationByIdempotencyKey: typeof defaultRepository.findOperationByIdempotencyKey
  findLatestCompletedOperation: typeof defaultRepository.findLatestCompletedOperation
  persistClosure: typeof defaultRepository.persistClosure
  persistRestore: typeof defaultRepository.persistRestore
  countAdjustmentsForOperation: typeof defaultRepository.countAdjustmentsForOperation
  createFollowUp: typeof defaultRepository.createFollowUp
  listLegacyArchives?: typeof defaultRepository.listLegacyArchives
}

let repository: ClosureRepository = defaultRepository as unknown as ClosureRepository

/** Test seam: swap the persistence layer for a fake. */
export function setClosureRepository(next: ClosureRepository): void {
  repository = next
}

export function resetClosureRepository(): void {
  repository = defaultRepository as unknown as ClosureRepository
}

export function requestHash(projectId: string, input: CloseProjectInput): string {
  const canonical = {
    projectId,
    closureType: input.closureType,
    reason: input.reason.trim(),
    closureVersion: input.closureVersion,
    previewFingerprint: input.previewFingerprint,
    invoiceResolutions: [...input.invoiceResolutions]
      .map((resolution) => ({
        invoiceId: resolution.invoiceId,
        type: resolution.type,
        amount: resolution.amount,
        reason: resolution.reason.trim(),
        externalReference: resolution.externalReference ?? null,
        evidenceUrl: resolution.evidenceUrl ?? null,
        managerAttestation: resolution.managerAttestation ?? false,
      }))
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
  }
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
}

export async function getClosurePreview(projectId: string): Promise<ClosurePreview | null> {
  const snapshot = await repository.loadClosureSnapshot(projectId)
  if (!snapshot) return null
  const requiresReconciliation =
    snapshot.project.isArchived && !(await repository.hasCompletedClosure(projectId))
  return buildClosurePreview(snapshot, { requiresReconciliation })
}

function statusById(rows: Array<{ id: string; status: string }>, id: string): string {
  return rows.find((row) => row.id === id)?.status ?? ''
}

const EMPTY_SUMMARY: ClosureResult['summary'] = {
  archivedDevis: 0,
  archivedInvoices: 0,
  archivedContracts: 0,
  cancelledTasks: 0,
  cancelledReminders: 0,
  invoiceAdjustments: 0,
  preserved: 0,
}

function replayStoredResult(
  existing: { id: string; projectId: string; requestHash: string; summary: Record<string, unknown> },
  input: CloseProjectInput,
  hash: string,
): ClosureResult {
  if (existing.requestHash !== hash) {
    throw new ClosurePolicyError(
      'IDEMPOTENCY_CONFLICT',
      'Cette clé d’idempotence a déjà servi pour une autre demande.',
    )
  }
  const summary = existing.summary as Partial<ClosureResult['summary']> & { restorable?: boolean }
  return {
    operationId: existing.id,
    projectId: existing.projectId,
    closureType: input.closureType,
    restorable: Boolean(summary.restorable),
    summary: { ...EMPTY_SUMMARY, ...summary },
  }
}

/**
 * Everything happens under the project lock: the idempotency check, the
 * snapshot reload, the policy evaluation and the writes. A stale preview or a
 * concurrent mutation is therefore rejected instead of silently applied.
 */
async function runClosure(
  projectId: string,
  input: CloseProjectInput,
  actorId: string,
  idempotencyKey: string,
  options: { allowArchived: boolean },
): Promise<ClosureResult> {
  const hash = requestHash(projectId, input)

  return repository.withProjectLock(projectId, async (handle) => {
    const existing = await repository.findOperationByIdempotencyKey(idempotencyKey, handle)
    if (existing) return replayStoredResult(existing, input, hash)

    const snapshot = await repository.loadClosureSnapshot(projectId, handle)
    if (!snapshot) throw new ClosurePolicyError('PROJECT_ARCHIVED', 'Projet introuvable.')

    if (options.allowArchived) {
      if (!snapshot.project.isArchived) {
        throw new ClosurePolicyError(
          'PROJECT_NOT_ARCHIVED',
          'Seule une archive historique peut être régularisée.',
        )
      }
      if (await repository.hasCompletedClosure(projectId, handle)) {
        throw new ClosurePolicyError('PROJECT_ALREADY_CLOSED', 'Ce dossier est déjà clôturé.')
      }
    }

    const plan = buildClosurePlan(snapshot, input, { allowArchived: options.allowArchived })
    const summary: ClosureResult['summary'] = {
      archivedDevis: plan.archiveDevisIds.length,
      archivedInvoices: plan.archiveInvoiceIds.length,
      archivedContracts: plan.archiveContractIds.length,
      cancelledTasks: plan.cancelTaskIds.length,
      cancelledReminders: plan.cancelReminderIds.length,
      invoiceAdjustments: plan.invoiceAdjustments.length,
      preserved: plan.preserved.length,
    }

    const currencyByInvoice = new Map(
      snapshot.invoices.map((invoice) => [invoice.id, invoice.currency]),
    )
    const operationId = await repository.persistClosure(
      {
        projectId,
        idempotencyKey,
        requestHash: hash,
        closureType: input.closureType,
        reason: input.reason.trim(),
        previewFingerprint: plan.fingerprint,
        actorId,
        summary: { ...summary, restorable: plan.restorable },
        invoiceAdjustments: plan.invoiceAdjustments.map((adjustment) => ({
          invoiceId: adjustment.invoiceId,
          projectId,
          type: adjustment.type,
          amount: adjustment.amount,
          currency: currencyByInvoice.get(adjustment.invoiceId) ?? 'FCFA',
          reason: adjustment.reason,
          externalReference: adjustment.externalReference,
          evidenceUrl: adjustment.evidenceUrl,
          managerAttestation: adjustment.managerAttestation ?? false,
          closureResolution: adjustment.closureResolution,
        })),
        archiveDevisIds: plan.archiveDevisIds,
        archiveInvoiceIds: plan.archiveInvoiceIds,
        archiveContractIds: plan.archiveContractIds,
        cancelDraftInvoiceIds: plan.cancelDraftInvoiceIds,
        // Le statut d'origine accompagne chaque annulation : sans lui, une
        // restauration rendrait un statut par défaut au lieu du vrai.
        cancelTasks: plan.cancelTaskIds.map((id) => ({
          id,
          status: statusById(snapshot.tasks, id),
        })),
        cancelReminders: plan.cancelReminderIds.map((id) => ({
          id,
          status: statusById(snapshot.reminders, id),
        })),
        preserved: plan.preserved,
        nextClosureVersion: snapshot.project.closureVersion + 1,
      },
      handle,
    )

    return {
      operationId,
      projectId,
      closureType: input.closureType,
      restorable: plan.restorable,
      summary,
    }
  })
}

export async function closeAndArchiveProject(
  projectId: string,
  input: CloseProjectInput,
  actorId: string,
  idempotencyKey: string,
): Promise<ClosureResult> {
  return runClosure(projectId, input, actorId, idempotencyKey, { allowArchived: false })
}

/** Regularize an archive created before the closure lifecycle existed. */
export async function reconcileLegacyArchive(
  projectId: string,
  input: CloseProjectInput,
  actorId: string,
  idempotencyKey: string,
): Promise<ClosureResult> {
  return runClosure(projectId, input, actorId, idempotencyKey, { allowArchived: true })
}

export async function restoreClosedProject(
  projectId: string,
  actorId: string,
): Promise<RestoreResult> {
  return repository.withProjectLock(projectId, async (handle) => {
    const operation = await repository.findLatestCompletedOperation(projectId, handle)
    if (!operation) {
      throw new ClosurePolicyError(
        'PROJECT_RESTORE_FORBIDDEN',
        'Aucune clôture réversible n’est enregistrée pour ce projet.',
      )
    }
    const adjustments = await repository.countAdjustmentsForOperation(operation.id, handle)
    if (adjustments > 0) {
      throw new ClosurePolicyError(
        'PROJECT_RESTORE_FORBIDDEN',
        'Le dossier contient un avoir ou une créance abandonnée : la restauration est interdite.',
      )
    }
    const restoredEntities = await repository.persistRestore(
      { projectId, operationId: operation.id, actorId },
      handle,
    )
    return { operationId: operation.id, projectId, restoredEntities }
  })
}

export async function createFollowUpProject(
  archivedProjectId: string,
  actorId: string,
): Promise<Record<string, unknown>> {
  const snapshot = await repository.loadClosureSnapshot(archivedProjectId)
  if (!snapshot) {
    throw new ClosurePolicyError('PROJECT_NOT_ARCHIVED', 'Projet introuvable.')
  }
  if (!snapshot.project.isArchived || !(await repository.hasCompletedClosure(archivedProjectId))) {
    throw new ClosurePolicyError(
      'PROJECT_NOT_ARCHIVED',
      'Un projet de suite ne peut naître que d’un dossier clôturé et scellé.',
    )
  }
  return repository.createFollowUp({ archivedProjectId, actorId })
}

export async function listArchiveReconciliation(): Promise<ArchiveReconciliationRow[]> {
  if (!repository.listLegacyArchives) return []
  return repository.listLegacyArchives()
}
