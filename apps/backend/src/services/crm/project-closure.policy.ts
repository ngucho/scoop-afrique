import { createHash } from 'node:crypto'
import type {
  CloseProjectInput,
  ClosurePlan,
  ClosurePreview,
  ClosureSnapshot,
  InvoiceAdjustmentPlan,
  InvoiceResolutionInput,
} from './project-closure.types.js'

export type ClosurePolicyErrorCode =
  | 'PROJECT_ARCHIVED'
  | 'PROJECT_ALREADY_CLOSED'
  | 'PROJECT_NOT_ARCHIVED'
  | 'CLOSURE_PREVIEW_STALE'
  | 'INVOICE_RESOLUTION_REQUIRED'
  | 'INVOICE_RESOLUTION_MISMATCH'
  | 'CREDIT_NOTE_REFERENCE_REQUIRED'
  | 'BAD_DEBT_EVIDENCE_REQUIRED'
  | 'PROJECT_RESTORE_FORBIDDEN'
  | 'IDEMPOTENCY_CONFLICT'

export class ClosurePolicyError extends Error {
  constructor(readonly code: ClosurePolicyErrorCode, message: string) {
    super(message)
    this.name = 'ClosurePolicyError'
  }
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(canonicalize)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !['displayName', 'label'].includes(key))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

export function closureFingerprint(snapshot: ClosureSnapshot): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(canonicalize(snapshot))).digest('hex')}`
}

function remaining(invoice: ClosureSnapshot['invoices'][number]): number {
  return Math.max(0, invoice.total - invoice.amountPaid)
}

function isOpenInvoice(invoice: ClosureSnapshot['invoices'][number]): boolean {
  return invoice.status !== 'draft' && invoice.status !== 'paid' && invoice.status !== 'cancelled' && remaining(invoice) > 0
}

function validateResolution(invoice: ClosureSnapshot['invoices'][number], resolution: InvoiceResolutionInput): void {
  if (resolution.type === 'credit_note' && invoice.status !== 'draft' && !resolution.externalReference?.trim()) {
    throw new ClosurePolicyError('CREDIT_NOTE_REFERENCE_REQUIRED', 'Une référence d’avoir est requise pour une facture émise.')
  }
  if (resolution.type === 'bad_debt' && !resolution.evidenceUrl?.trim() && !resolution.managerAttestation) {
    throw new ClosurePolicyError('BAD_DEBT_EVIDENCE_REQUIRED', 'Une preuve ou attestation manager est requise pour une créance abandonnée.')
  }
}

export function buildClosurePreview(
  snapshot: ClosureSnapshot,
  options: { requiresReconciliation?: boolean } = {},
): ClosurePreview {
  return {
    closureVersion: snapshot.project.closureVersion,
    fingerprint: closureFingerprint(snapshot),
    requiresReconciliation: options.requiresReconciliation ?? false,
    openInvoices: snapshot.invoices
      .filter(isOpenInvoice)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((invoice) => ({
        id: invoice.id,
        reference: invoice.reference,
        remaining: remaining(invoice),
        allowedResolutions: ['credit_note', 'bad_debt'],
      })),
    counts: {
      devis: snapshot.devis.length,
      invoices: snapshot.invoices.length,
      contracts: snapshot.contracts.length,
      tasks: snapshot.tasks.length,
      reminders: snapshot.reminders.length,
      payments: snapshot.payments.length,
      receipts: snapshot.receipts.length,
      expenses: snapshot.expenses.length,
      treasuryMovements: snapshot.treasuryMovements.length,
    },
  }
}

export function buildClosurePlan(
  snapshot: ClosureSnapshot,
  input: CloseProjectInput,
  options: { allowArchived?: boolean } = {},
): ClosurePlan {
  if (snapshot.project.isArchived && !options.allowArchived) {
    throw new ClosurePolicyError('PROJECT_ARCHIVED', 'Le projet est déjà archivé.')
  }
  const fingerprint = closureFingerprint(snapshot)
  if (input.closureVersion !== snapshot.project.closureVersion || input.previewFingerprint !== fingerprint) {
    throw new ClosurePolicyError('CLOSURE_PREVIEW_STALE', 'L’aperçu de clôture n’est plus à jour.')
  }

  const resolutionsByInvoice = new Map<string, InvoiceResolutionInput[]>()
  for (const resolution of input.invoiceResolutions) {
    const values = resolutionsByInvoice.get(resolution.invoiceId) ?? []
    values.push(resolution)
    resolutionsByInvoice.set(resolution.invoiceId, values)
  }

  const openInvoiceIds = new Set(snapshot.invoices.filter(isOpenInvoice).map((invoice) => invoice.id))
  for (const invoiceId of resolutionsByInvoice.keys()) {
    if (!openInvoiceIds.has(invoiceId)) {
      throw new ClosurePolicyError('INVOICE_RESOLUTION_MISMATCH', 'La facture indiquée ne requiert pas de résolution.')
    }
  }

  const invoiceAdjustments: InvoiceAdjustmentPlan[] = []
  for (const invoice of snapshot.invoices.filter(isOpenInvoice)) {
    const resolutions = resolutionsByInvoice.get(invoice.id)
    if (!resolutions?.length) {
      throw new ClosurePolicyError('INVOICE_RESOLUTION_REQUIRED', 'Chaque facture ouverte doit être résolue.')
    }
    const resolvedAmount = resolutions.reduce((sum, resolution) => sum + resolution.amount, 0)
    if (resolvedAmount !== remaining(invoice)) {
      throw new ClosurePolicyError('INVOICE_RESOLUTION_MISMATCH', 'Le montant de résolution doit correspondre au solde restant.')
    }
    const closureResolution = new Set(resolutions.map((resolution) => resolution.type)).size > 1 ? 'mixed' : resolutions[0].type
    for (const resolution of resolutions) {
      validateResolution(invoice, resolution)
      invoiceAdjustments.push({ ...resolution, closureResolution })
    }
  }

  const preserved = [
    ...snapshot.payments.map(({ id }) => ({ entityType: 'payment', entityId: id })),
    ...snapshot.receipts.map(({ id }) => ({ entityType: 'receipt', entityId: id })),
    ...snapshot.expenses.map(({ id }) => ({ entityType: 'expense', entityId: id })),
    ...snapshot.treasuryMovements.map(({ id }) => ({ entityType: 'treasury_movement', entityId: id })),
    ...snapshot.deliverables.map(({ id }) => ({ entityType: 'deliverable', entityId: id })),
  ]

  return {
    fingerprint,
    invoiceAdjustments,
    archiveDevisIds: snapshot.devis.filter((devis) => !devis.isArchived).map((devis) => devis.id).sort(),
    archiveInvoiceIds: snapshot.invoices.filter((invoice) => !invoice.isArchived).map((invoice) => invoice.id).sort(),
    archiveContractIds: snapshot.contracts.filter((contract) => !contract.isArchived).map((contract) => contract.id).sort(),
    cancelDraftInvoiceIds: snapshot.invoices.filter((invoice) => invoice.status === 'draft').map((invoice) => invoice.id).sort(),
    cancelTaskIds: snapshot.tasks.filter((task) => !['done', 'cancelled'].includes(task.status)).map((task) => task.id).sort(),
    cancelReminderIds: snapshot.reminders.filter((reminder) => ['draft', 'scheduled'].includes(reminder.status)).map((reminder) => reminder.id).sort(),
    preserved,
    restorable: invoiceAdjustments.length === 0,
  }
}
