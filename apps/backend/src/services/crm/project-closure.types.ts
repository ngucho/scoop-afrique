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
  openInvoices: Array<{ id: string; remaining: number; allowedResolutions: InvoiceResolutionType[] }>
  counts: Record<string, number>
}
