export type ClosureType = 'completed' | 'client_abandoned' | 'mutual_termination' | 'company_cancelled'
export type InvoiceResolutionType = 'credit_note' | 'bad_debt'

export interface ClosureProject {
  id: string
  reference: string
  closureVersion: number
  isArchived: boolean
}

export interface ClosureDocument {
  id: string
  status: string
  isArchived: boolean
  reference?: string
  updatedAt?: string
}

export interface ClosureInvoice extends ClosureDocument {
  total: number
  amountPaid: number
  currency: string
}

export interface ClosureSnapshot {
  project: ClosureProject
  devis: ClosureDocument[]
  invoices: ClosureInvoice[]
  contracts: ClosureDocument[]
  payments: Array<{ id: string; invoiceId: string; amount: number; paidAt: string }>
  receipts: Array<{ id: string; paymentId: string }>
  tasks: Array<{ id: string; status: string }>
  reminders: Array<{ id: string; status: string; scheduledAt?: string }>
  deliverables: Array<{ id: string }>
  expenses: Array<{ id: string; amount: number }>
  treasuryMovements: Array<{ id: string; amount: number }>
}

export interface InvoiceResolutionInput {
  invoiceId: string
  type: InvoiceResolutionType
  amount: number
  reason: string
  externalReference?: string
  evidenceUrl?: string
  managerAttestation?: boolean
}

export interface CloseProjectInput {
  closureType: ClosureType
  reason: string
  closureVersion: number
  previewFingerprint: string
  invoiceResolutions: InvoiceResolutionInput[]
}

export interface InvoiceAdjustmentPlan extends InvoiceResolutionInput {
  closureResolution: InvoiceResolutionType | 'mixed'
}

export interface ClosurePlan {
  fingerprint: string
  invoiceAdjustments: InvoiceAdjustmentPlan[]
  archiveDevisIds: string[]
  archiveInvoiceIds: string[]
  archiveContractIds: string[]
  cancelDraftInvoiceIds: string[]
  cancelTaskIds: string[]
  cancelReminderIds: string[]
  preserved: Array<{ entityType: string; entityId: string }>
  restorable: boolean
}

export interface ClosurePreview {
  closureVersion: number
  fingerprint: string
  /** Archive héritée sans opération de clôture enregistrée. */
  requiresReconciliation: boolean
  openInvoices: Array<{
    id: string
    reference?: string
    remaining: number
    allowedResolutions: InvoiceResolutionType[]
  }>
  counts: Record<string, number>
}

export interface ClosureResult {
  operationId: string
  projectId: string
  closureType: ClosureType
  restorable: boolean
  summary: {
    archivedDevis: number
    archivedInvoices: number
    archivedContracts: number
    cancelledTasks: number
    cancelledReminders: number
    invoiceAdjustments: number
    preserved: number
  }
}

export interface RestoreResult {
  operationId: string
  projectId: string
  restoredEntities: number
}

export interface ArchiveReconciliationRow {
  projectId: string
  reference: string
  title: string
  archivedAt: string | null
  archiveReason: string | null
  counts: Record<string, number>
  unresolvedInvoiceTotal: number
}
