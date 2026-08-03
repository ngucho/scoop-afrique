/**
 * CRM project closure routes.
 *
 * Mounted under `/projects` before the generic project router so the closure
 * paths are matched before `/:id`. Every path here requires `manage:crm`
 * (see `middleware/crm-authorization.ts`).
 */
import { Hono, type Context } from 'hono'
import { closeProjectSchema } from '../../schemas/crm/project-closure.schema.js'
import { ClosurePolicyError, type ClosurePolicyErrorCode } from '../../services/crm/project-closure.policy.js'
import * as closureService from '../../services/crm/project-closure.service.js'
import type {
  ArchiveReconciliationRow,
  CloseProjectInput,
  ClosurePreview,
  ClosureResult,
  RestoreResult,
} from '../../services/crm/project-closure.types.js'
import type { AppEnv } from '../../types.js'

export interface ProjectClosureRouteDeps {
  getClosurePreview: (projectId: string) => Promise<ClosurePreview | null>
  closeAndArchiveProject?: (
    projectId: string,
    input: CloseProjectInput,
    actorId: string,
    idempotencyKey: string,
  ) => Promise<ClosureResult>
  reconcileLegacyArchive?: (
    projectId: string,
    input: CloseProjectInput,
    actorId: string,
    idempotencyKey: string,
  ) => Promise<ClosureResult>
  restoreClosedProject?: (projectId: string, actorId: string) => Promise<RestoreResult>
  createFollowUpProject?: (
    archivedProjectId: string,
    actorId: string,
  ) => Promise<Record<string, unknown>>
  listArchiveReconciliation?: () => Promise<ArchiveReconciliationRow[]>
}

const ERROR_STATUS: Record<ClosurePolicyErrorCode, 409 | 422> = {
  PROJECT_ARCHIVED: 409,
  PROJECT_ALREADY_CLOSED: 409,
  PROJECT_NOT_ARCHIVED: 409,
  CLOSURE_PREVIEW_STALE: 409,
  INVOICE_RESOLUTION_REQUIRED: 422,
  INVOICE_RESOLUTION_MISMATCH: 422,
  CREDIT_NOTE_REFERENCE_REQUIRED: 422,
  BAD_DEBT_EVIDENCE_REQUIRED: 422,
  PROJECT_RESTORE_FORBIDDEN: 409,
  IDEMPOTENCY_CONFLICT: 409,
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function serializePreview(preview: ClosurePreview): Record<string, unknown> {
  return {
    closure_version: preview.closureVersion,
    fingerprint: preview.fingerprint,
    requires_reconciliation: preview.requiresReconciliation,
    open_invoices: preview.openInvoices.map((invoice) => ({
      id: invoice.id,
      reference: invoice.reference,
      remaining: invoice.remaining,
      allowed_resolutions: invoice.allowedResolutions,
    })),
    counts: preview.counts,
  }
}

function serializeClosure(result: ClosureResult): Record<string, unknown> {
  return {
    operation_id: result.operationId,
    project_id: result.projectId,
    closure_type: result.closureType,
    restorable: result.restorable,
    summary: {
      archived_devis: result.summary.archivedDevis,
      archived_invoices: result.summary.archivedInvoices,
      archived_contracts: result.summary.archivedContracts,
      cancelled_tasks: result.summary.cancelledTasks,
      cancelled_reminders: result.summary.cancelledReminders,
      invoice_adjustments: result.summary.invoiceAdjustments,
      preserved: result.summary.preserved,
    },
  }
}

function toClosureInput(parsed: {
  closure_type: CloseProjectInput['closureType']
  reason: string
  closure_version: number
  preview_fingerprint: string
  invoice_resolutions: Array<{
    invoice_id: string
    type: 'credit_note' | 'bad_debt'
    amount: number
    reason: string
    external_reference?: string
    evidence_url?: string
    manager_attestation?: true
  }>
}): CloseProjectInput {
  return {
    closureType: parsed.closure_type,
    reason: parsed.reason,
    closureVersion: parsed.closure_version,
    previewFingerprint: parsed.preview_fingerprint,
    invoiceResolutions: parsed.invoice_resolutions.map((resolution) => ({
      invoiceId: resolution.invoice_id,
      type: resolution.type,
      amount: resolution.amount,
      reason: resolution.reason,
      externalReference: resolution.external_reference,
      evidenceUrl: resolution.evidence_url,
      managerAttestation: resolution.manager_attestation,
    })),
  }
}

export function createProjectClosureRoutes(deps: ProjectClosureRouteDeps) {
  const app = new Hono<AppEnv>()

  const fail = (error: unknown) => {
    if (error instanceof ClosurePolicyError) {
      return { status: ERROR_STATUS[error.code], body: { error: error.code, message: error.message } }
    }
    throw error
  }

  app.get('/archive-reconciliation', async (c) => {
    if (!deps.listArchiveReconciliation) return c.json({ data: [] })
    const rows = await deps.listArchiveReconciliation()
    return c.json({
      data: rows.map((row) => ({
        project_id: row.projectId,
        reference: row.reference,
        title: row.title,
        archived_at: row.archivedAt,
        archive_reason: row.archiveReason,
        counts: row.counts,
        unresolved_invoice_total: row.unresolvedInvoiceTotal,
      })),
    })
  })

  app.get('/:id/closure-preview', async (c) => {
    const preview = await deps.getClosurePreview(c.req.param('id'))
    if (!preview) return c.json({ error: 'Not found' }, 404)
    return c.json({ data: serializePreview(preview) })
  })

  const closeHandler = (mode: 'close' | 'reconcile') => async (c: Context<AppEnv>) => {
    const handler = mode === 'close' ? deps.closeAndArchiveProject : deps.reconcileLegacyArchive
    if (!handler) return c.json({ error: 'Not found' }, 404)

    const idempotencyKey = c.req.header('Idempotency-Key')?.trim() ?? ''
    if (!UUID_PATTERN.test(idempotencyKey)) {
      return c.json({ error: 'IDEMPOTENCY_KEY_REQUIRED', message: 'En-tête Idempotency-Key (UUID) requis.' }, 400)
    }

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400)
    }
    const parsed = closeProjectSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.errors[0]
      return c.json({ error: 'VALIDATION_ERROR', message: first?.message ?? 'Validation error' }, 400)
    }

    try {
      const result = await handler(
        c.req.param('id'),
        toClosureInput(parsed.data),
        c.get('user')?.id ?? '',
        idempotencyKey,
      )
      return c.json({ data: serializeClosure(result) })
    } catch (error) {
      const mapped = fail(error)
      return c.json(mapped.body, mapped.status)
    }
  }

  app.post('/:id/close-and-archive', closeHandler('close'))
  app.post('/:id/archive-reconciliation', closeHandler('reconcile'))

  app.post('/:id/create-follow-up', async (c) => {
    if (!deps.createFollowUpProject) return c.json({ error: 'Not found' }, 404)
    try {
      const project = await deps.createFollowUpProject(c.req.param('id'), c.get('user')?.id ?? '')
      return c.json({ data: project }, 201)
    } catch (error) {
      const mapped = fail(error)
      return c.json(mapped.body, mapped.status)
    }
  })

  return app
}

export default createProjectClosureRoutes({
  getClosurePreview: closureService.getClosurePreview,
  closeAndArchiveProject: closureService.closeAndArchiveProject,
  reconcileLegacyArchive: closureService.reconcileLegacyArchive,
  restoreClosedProject: closureService.restoreClosedProject,
  createFollowUpProject: closureService.createFollowUpProject,
  listArchiveReconciliation: closureService.listArchiveReconciliation,
})
