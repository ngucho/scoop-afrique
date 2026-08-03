import test from 'node:test'
import assert from 'node:assert/strict'
import { createProjectClosureRoutes } from './project-closure.js'
import { ClosurePolicyError } from '../../services/crm/project-closure.policy.js'
import type {
  ClosurePreview,
  ClosureResult,
} from '../../services/crm/project-closure.types.js'

const IDEMPOTENCY_KEY = '44444444-4444-4444-8444-444444444444'

const closureResult: ClosureResult = {
  operationId: 'operation-1',
  projectId: 'project-1',
  closureType: 'client_abandoned',
  restorable: false,
  summary: {
    archivedDevis: 1,
    archivedInvoices: 2,
    archivedContracts: 0,
    cancelledTasks: 3,
    cancelledReminders: 1,
    invoiceAdjustments: 1,
    preserved: 4,
  },
}

const closePayload = {
  closure_type: 'client_abandoned',
  reason: 'Le client a définitivement abandonné le projet.',
  closure_version: 3,
  preview_fingerprint: `sha256:${'a'.repeat(64)}`,
  invoice_resolutions: [
    {
      invoice_id: '55555555-5555-4555-8555-555555555555',
      type: 'bad_debt',
      amount: 150000,
      reason: 'Créance abandonnée après relances',
      manager_attestation: true,
    },
  ],
}

function closeRequest(body: unknown = closePayload, headers: Record<string, string> = {}) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': IDEMPOTENCY_KEY,
      ...headers,
    },
    body: JSON.stringify(body),
  }
}

const previewFixture: ClosurePreview = {
  closureVersion: 3,
  fingerprint: `sha256:${'a'.repeat(64)}`,
  requiresReconciliation: false,
  openInvoices: [
    { id: 'invoice-1', reference: 'FAC-1', remaining: 150000, allowedResolutions: ['credit_note', 'bad_debt'] },
  ],
  counts: {
    devis: 1,
    invoices: 2,
    contracts: 0,
    tasks: 4,
    reminders: 1,
    payments: 1,
    receipts: 1,
    expenses: 2,
    treasuryMovements: 0,
  },
}

function routesWith(overrides: Partial<Parameters<typeof createProjectClosureRoutes>[0]> = {}) {
  return createProjectClosureRoutes({
    getClosurePreview: async () => previewFixture,
    ...overrides,
  })
}

test('closure preview returns 404 for a missing project', async () => {
  const app = routesWith({ getClosurePreview: async () => null })
  const response = await app.request('/missing/closure-preview')
  assert.equal(response.status, 404)
})

test('closure preview returns counts, balances, version and fingerprint', async () => {
  const app = routesWith()
  const response = await app.request('/project-1/closure-preview')
  const body = (await response.json()) as { data: Record<string, unknown> }

  assert.equal(response.status, 200)
  assert.equal(body.data.closure_version, 3)
  assert.equal(body.data.fingerprint, previewFixture.fingerprint)
  assert.equal(body.data.requires_reconciliation, false)
  assert.deepEqual(body.data.open_invoices, [
    {
      id: 'invoice-1',
      reference: 'FAC-1',
      remaining: 150000,
      allowed_resolutions: ['credit_note', 'bad_debt'],
    },
  ])
  assert.deepEqual(body.data.counts, previewFixture.counts)
})

test('closure preview flags a legacy archive as requiring reconciliation', async () => {
  const app = routesWith({
    getClosurePreview: async () => ({ ...previewFixture, requiresReconciliation: true }),
  })
  const response = await app.request('/legacy-1/closure-preview')
  const body = (await response.json()) as { data: Record<string, unknown> }

  assert.equal(response.status, 200)
  assert.equal(body.data.requires_reconciliation, true)
})

test('closure preview performs no mutation', async () => {
  let mutated = false
  const app = routesWith({
    getClosurePreview: async () => previewFixture,
    closeAndArchiveProject: async () => {
      mutated = true
      throw new Error('preview must not close the project')
    },
  })

  const response = await app.request('/project-1/closure-preview')

  assert.equal(response.status, 200)
  assert.equal(mutated, false)
})

test('closing a project returns the operation summary', async () => {
  const app = routesWith({ closeAndArchiveProject: async () => closureResult })
  const response = await app.request('/project-1/close-and-archive', closeRequest())
  const body = (await response.json()) as { data: Record<string, unknown> }

  assert.equal(response.status, 200)
  assert.equal(body.data.operation_id, 'operation-1')
  assert.equal(body.data.restorable, false)
  assert.deepEqual(body.data.summary, {
    archived_devis: 1,
    archived_invoices: 2,
    archived_contracts: 0,
    cancelled_tasks: 3,
    cancelled_reminders: 1,
    invoice_adjustments: 1,
    preserved: 4,
  })
})

test('closing a project forwards the idempotency key and the parsed input', async () => {
  let seenKey: string | null = null
  let seenResolutions = 0
  const app = routesWith({
    closeAndArchiveProject: async (_projectId, input, _actorId, key) => {
      seenKey = key
      seenResolutions = input.invoiceResolutions.length
      assert.equal(input.invoiceResolutions[0].invoiceId, closePayload.invoice_resolutions[0].invoice_id)
      assert.equal(input.invoiceResolutions[0].managerAttestation, true)
      return closureResult
    },
  })

  const response = await app.request('/project-1/close-and-archive', closeRequest())

  assert.equal(response.status, 200)
  assert.equal(seenKey, IDEMPOTENCY_KEY)
  assert.equal(seenResolutions, 1)
})

test('a missing or malformed idempotency key is rejected with 400', async () => {
  const app = routesWith({ closeAndArchiveProject: async () => closureResult })

  const missing = await app.request('/project-1/close-and-archive', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(closePayload),
  })
  assert.equal(missing.status, 400)
  assert.equal(((await missing.json()) as { error: string }).error, 'IDEMPOTENCY_KEY_REQUIRED')

  const malformed = await app.request(
    '/project-1/close-and-archive',
    closeRequest(closePayload, { 'Idempotency-Key': 'not-a-uuid' }),
  )
  assert.equal(malformed.status, 400)
})

test('an invalid payload is rejected before any closure runs', async () => {
  let called = false
  const app = routesWith({
    closeAndArchiveProject: async () => {
      called = true
      return closureResult
    },
  })

  const response = await app.request(
    '/project-1/close-and-archive',
    closeRequest({ ...closePayload, reason: 'court' }),
  )

  assert.equal(response.status, 400)
  assert.equal(called, false)
})

test('domain error codes map to their documented HTTP status', async () => {
  const expected: Array<[string, number]> = [
    ['PROJECT_ARCHIVED', 409],
    ['PROJECT_ALREADY_CLOSED', 409],
    ['CLOSURE_PREVIEW_STALE', 409],
    ['INVOICE_RESOLUTION_REQUIRED', 422],
    ['INVOICE_RESOLUTION_MISMATCH', 422],
    ['CREDIT_NOTE_REFERENCE_REQUIRED', 422],
    ['IDEMPOTENCY_CONFLICT', 409],
  ]

  for (const [code, status] of expected) {
    const app = routesWith({
      closeAndArchiveProject: async () => {
        throw new ClosurePolicyError(code as never, 'message')
      },
    })
    const response = await app.request('/project-1/close-and-archive', closeRequest())
    assert.equal(response.status, status, `${code} should map to ${status}`)
    assert.equal(((await response.json()) as { error: string }).error, code)
  }
})

test('a forbidden restoration maps to 409', async () => {
  const app = routesWith({
    createFollowUpProject: async () => {
      throw new ClosurePolicyError('PROJECT_RESTORE_FORBIDDEN', 'interdit')
    },
  })
  const response = await app.request('/project-1/create-follow-up', { method: 'POST' })

  assert.equal(response.status, 409)
  assert.equal(((await response.json()) as { error: string }).error, 'PROJECT_RESTORE_FORBIDDEN')
})

test('follow-up creation returns the new project', async () => {
  const app = routesWith({
    createFollowUpProject: async (projectId) => ({
      id: 'project-2',
      reference: 'PRJ-002',
      predecessor_project_id: projectId,
    }),
  })
  const response = await app.request('/project-1/create-follow-up', { method: 'POST' })
  const body = (await response.json()) as { data: Record<string, unknown> }

  assert.equal(response.status, 201)
  assert.equal(body.data.id, 'project-2')
  assert.equal(body.data.predecessor_project_id, 'project-1')
})

test('the reconciliation listing is exposed on its own path', async () => {
  const app = routesWith({
    listArchiveReconciliation: async () => [
      {
        projectId: 'legacy-1',
        reference: 'PRJ-000',
        title: 'Ancien dossier',
        archivedAt: '2026-01-04T10:00:00.000Z',
        archiveReason: 'Archive antérieure à la gestion des clôtures',
        counts: { devis: 1, invoices: 1, contracts: 0, tasks: 2, reminders: 0 },
        unresolvedInvoiceTotal: 250000,
      },
    ],
  })

  const response = await app.request('/archive-reconciliation')
  const body = (await response.json()) as { data: Array<Record<string, unknown>> }

  assert.equal(response.status, 200)
  assert.equal(body.data[0].project_id, 'legacy-1')
  assert.equal(body.data[0].unresolved_invoice_total, 250000)
})

test('reconciliation of a legacy archive uses its own handler', async () => {
  let closeCalled = false
  let reconcileCalled = false
  const app = routesWith({
    closeAndArchiveProject: async () => {
      closeCalled = true
      return closureResult
    },
    reconcileLegacyArchive: async () => {
      reconcileCalled = true
      return closureResult
    },
  })

  const response = await app.request('/legacy-1/archive-reconciliation', closeRequest())

  assert.equal(response.status, 200)
  assert.equal(reconcileCalled, true)
  assert.equal(closeCalled, false)
})
