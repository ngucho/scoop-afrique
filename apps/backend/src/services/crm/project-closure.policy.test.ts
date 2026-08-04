import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildClosurePlan,
  buildClosurePreview,
  closureFingerprint,
  ClosurePolicyError,
} from './project-closure.policy.js'
import type { CloseProjectInput, ClosureSnapshot } from './project-closure.types.js'

const baseSnapshot = (): ClosureSnapshot => ({
  project: { id: 'project-1', reference: 'PRJ-001', closureVersion: 4, isArchived: false },
  devis: [{ id: 'devis-1', status: 'sent', isArchived: false }],
  invoices: [
    { id: 'invoice-paid', status: 'paid', total: 100_000, amountPaid: 100_000, currency: 'FCFA', isArchived: false },
    { id: 'invoice-open', status: 'partial', total: 300_000, amountPaid: 100_000, currency: 'FCFA', isArchived: false },
    { id: 'invoice-draft', status: 'draft', total: 50_000, amountPaid: 0, currency: 'FCFA', isArchived: false },
  ],
  contracts: [{ id: 'contract-1', status: 'signed', isArchived: false }],
  payments: [{ id: 'payment-1', invoiceId: 'invoice-paid', amount: 100_000, paidAt: '2026-08-01T09:00:00.000Z' }],
  receipts: [{ id: 'receipt-1', paymentId: 'payment-1' }],
  tasks: [
    { id: 'task-open', status: 'todo' },
    { id: 'task-done', status: 'done' },
  ],
  reminders: [
    { id: 'reminder-future', status: 'scheduled', scheduledAt: '2026-08-10T09:00:00.000Z' },
    { id: 'reminder-sent', status: 'sent' },
  ],
  deliverables: [{ id: 'deliverable-1' }],
  expenses: [{ id: 'expense-1', amount: 10_000 }],
  treasuryMovements: [{ id: 'treasury-1', amount: 10_000 }],
})

const closeInput = (snapshot: ClosureSnapshot, invoiceResolutions: CloseProjectInput['invoiceResolutions'] = []): CloseProjectInput => ({
  closureType: 'client_abandoned',
  reason: 'Le client a abandonné le projet en cours.',
  closureVersion: 4,
  previewFingerprint: closureFingerprint(snapshot),
  invoiceResolutions,
})

test('paid invoices require no adjustment', () => {
  const snapshot = baseSnapshot()
  snapshot.invoices = [snapshot.invoices[0]]

  const plan = buildClosurePlan(snapshot, closeInput(snapshot))

  assert.deepEqual(plan.invoiceAdjustments, [])
})

test('resolutions for invoices that are not open are rejected', () => {
  const snapshot = baseSnapshot()
  snapshot.invoices = [snapshot.invoices[0]]

  assert.throws(
    () => buildClosurePlan(snapshot, closeInput(snapshot, [{ invoiceId: 'invoice-paid', type: 'bad_debt', amount: 1, reason: 'Résolution invalide', managerAttestation: true }])),
    (error: unknown) => error instanceof ClosurePolicyError && error.code === 'INVOICE_RESOLUTION_MISMATCH',
  )
})

test('draft invoices are cancelled and archived', () => {
  const snapshot = baseSnapshot()
  snapshot.invoices = [snapshot.invoices[2]]

  const plan = buildClosurePlan(snapshot, closeInput(snapshot))

  assert.deepEqual(plan.cancelDraftInvoiceIds, ['invoice-draft'])
  assert.deepEqual(plan.archiveInvoiceIds, ['invoice-draft'])
})

test('an open invoice requires an exact remaining-balance resolution', () => {
  const snapshot = baseSnapshot()
  snapshot.invoices = [snapshot.invoices[1]]

  assert.throws(
    () => buildClosurePlan(snapshot, closeInput(snapshot)),
    (error: unknown) => error instanceof ClosurePolicyError && error.code === 'INVOICE_RESOLUTION_REQUIRED',
  )
  assert.throws(
    () => buildClosurePlan(snapshot, closeInput(snapshot, [{ invoiceId: 'invoice-open', type: 'bad_debt', amount: 199_999, reason: 'Créance abandonnée', managerAttestation: true }])),
    (error: unknown) => error instanceof ClosurePolicyError && error.code === 'INVOICE_RESOLUTION_MISMATCH',
  )
})

test('a credit note for an issued invoice requires an external reference', () => {
  const snapshot = baseSnapshot()
  snapshot.invoices = [snapshot.invoices[1]]

  assert.throws(
    () => buildClosurePlan(snapshot, closeInput(snapshot, [{ invoiceId: 'invoice-open', type: 'credit_note', amount: 200_000, reason: 'Prestation non réalisée' }])),
    (error: unknown) => error instanceof ClosurePolicyError && error.code === 'CREDIT_NOTE_REFERENCE_REQUIRED',
  )
})

test('bad debt preserves the original invoice total', () => {
  const snapshot = baseSnapshot()
  snapshot.invoices = [snapshot.invoices[1]]

  const plan = buildClosurePlan(snapshot, closeInput(snapshot, [{ invoiceId: 'invoice-open', type: 'bad_debt', amount: 200_000, reason: 'Créance abandonnée', managerAttestation: true }]))

  assert.equal(snapshot.invoices[0].total, 300_000)
  assert.equal(plan.invoiceAdjustments[0].amount, 200_000)
})

test('open tasks and future reminders are cancelled', () => {
  const snapshot = baseSnapshot()
  snapshot.invoices = [snapshot.invoices[0]]

  const plan = buildClosurePlan(snapshot, closeInput(snapshot))

  assert.deepEqual(plan.cancelTaskIds, ['task-open'])
  assert.deepEqual(plan.cancelReminderIds, ['reminder-future'])
})

test('payments receipts expenses and treasury movements are preserved', () => {
  const snapshot = baseSnapshot()
  snapshot.invoices = [snapshot.invoices[0]]

  const plan = buildClosurePlan(snapshot, closeInput(snapshot))

  assert.deepEqual(plan.preserved.map((item) => item.entityId), ['payment-1', 'receipt-1', 'expense-1', 'treasury-1', 'deliverable-1'])
})

test('fingerprints are stable for identical snapshots', () => {
  assert.equal(closureFingerprint(baseSnapshot()), closureFingerprint(baseSnapshot()))
})

test('fingerprints change when a payment or document changes', () => {
  const changedPayment = baseSnapshot()
  changedPayment.payments[0].amount = 99_999
  const changedDocument = baseSnapshot()
  changedDocument.devis[0].status = 'accepted'

  const original = closureFingerprint(baseSnapshot())
  assert.notEqual(original, closureFingerprint(changedPayment))
  assert.notEqual(original, closureFingerprint(changedDocument))
})

test('restoration is forbidden after a credit note or bad debt', () => {
  const snapshot = baseSnapshot()
  snapshot.invoices = [snapshot.invoices[1]]

  const plan = buildClosurePlan(snapshot, closeInput(snapshot, [{ invoiceId: 'invoice-open', type: 'bad_debt', amount: 200_000, reason: 'Créance abandonnée', managerAttestation: true }]))

  assert.equal(plan.restorable, false)
  assert.equal(buildClosurePreview(snapshot).openInvoices[0].remaining, 200_000)
})
