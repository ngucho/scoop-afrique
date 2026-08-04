import assert from 'node:assert/strict'
import test from 'node:test'
import { ClosurePolicyError } from './project-closure.policy.js'
import {
  closeAndArchiveProject,
  createFollowUpProject,
  reconcileLegacyArchive,
  requestHash,
  resetClosureRepository,
  restoreClosedProject,
  setClosureRepository,
  type ClosureRepository,
} from './project-closure.service.js'
import { closureFingerprint } from './project-closure.policy.js'
import type { CloseProjectInput, ClosureSnapshot } from './project-closure.types.js'

const ACTOR = '11111111-1111-4111-8111-111111111111'
const KEY_A = '22222222-2222-4222-8222-222222222222'
const KEY_B = '33333333-3333-4333-8333-333333333333'

function snapshotFixture(overrides: Partial<ClosureSnapshot> = {}): ClosureSnapshot {
  return {
    project: { id: 'project-1', reference: 'PRJ-001', closureVersion: 2, isArchived: false },
    devis: [{ id: 'devis-1', status: 'accepted', isArchived: false }],
    invoices: [
      {
        id: 'invoice-open',
        status: 'partial',
        total: 300_000,
        amountPaid: 100_000,
        currency: 'FCFA',
        isArchived: false,
      },
    ],
    contracts: [],
    payments: [
      { id: 'payment-1', invoiceId: 'invoice-open', amount: 100_000, paidAt: '2026-07-01T00:00:00.000Z' },
    ],
    receipts: [],
    tasks: [{ id: 'task-1', status: 'todo' }],
    reminders: [],
    deliverables: [],
    expenses: [],
    treasuryMovements: [],
    ...overrides,
  }
}

interface FakeState {
  calls: string[]
  operations: Array<{
    id: string
    projectId: string
    idempotencyKey: string
    requestHash: string
    status: 'completed' | 'reversed'
    summary: Record<string, unknown>
    adjustments: number
  }>
  committedItems: Array<{
    entityType: string
    entityId: string
    action: string
    previousStatus?: string
  }>
  restoredOperationIds: string[]
  followUps: Array<Record<string, unknown>>
}

interface FakeOptions {
  snapshot?: ClosureSnapshot | null
  hasCompletedClosure?: boolean
  throwOnPersist?: Error
  existingOperations?: FakeState['operations']
  existingItems?: Array<{ operationId: string; entityType: string; entityId: string; action: string }>
}

function createFakeRepository(options: FakeOptions = {}): {
  repository: ClosureRepository
  state: FakeState
} {
  const state: FakeState = {
    calls: [],
    operations: options.existingOperations ? [...options.existingOperations] : [],
    committedItems: [],
    restoredOperationIds: [],
    followUps: [],
  }
  let sequence = 0

  const repository = {
    async withProjectLock(_projectId: string, fn: (handle: unknown) => Promise<unknown>) {
      state.calls.push('lock')
      const snapshotOfOperations = state.operations.map((operation) => ({ ...operation }))
      const snapshotOfItems = [...state.committedItems]
      try {
        return (await fn({ tx: true })) as never
      } catch (error) {
        // Rollback : la transaction ne laisse aucun effet partiel.
        state.operations = snapshotOfOperations
        state.committedItems = snapshotOfItems
        state.calls.push('rollback')
        throw error
      }
    },
    async loadClosureSnapshot() {
      state.calls.push('loadSnapshot')
      return options.snapshot === undefined ? snapshotFixture() : options.snapshot
    },
    async hasCompletedClosure() {
      state.calls.push('hasCompletedClosure')
      return options.hasCompletedClosure ?? false
    },
    async findOperationByIdempotencyKey(idempotencyKey: string) {
      state.calls.push('findByIdempotencyKey')
      return state.operations.find((operation) => operation.idempotencyKey === idempotencyKey) ?? null
    },
    async findLatestCompletedOperation(projectId: string) {
      state.calls.push('findLatestCompleted')
      return (
        [...state.operations]
          .reverse()
          .find((operation) => operation.projectId === projectId && operation.status === 'completed') ??
        null
      )
    },
    async persistClosure(commit: Record<string, unknown>) {
      state.calls.push('persistClosure')
      if (options.throwOnPersist) throw options.throwOnPersist
      sequence += 1
      const id = `operation-${sequence}`
      const adjustments = commit.invoiceAdjustments as unknown[]
      state.operations.push({
        id,
        projectId: commit.projectId as string,
        idempotencyKey: commit.idempotencyKey as string,
        requestHash: commit.requestHash as string,
        status: 'completed',
        summary: commit.summary as Record<string, unknown>,
        adjustments: adjustments.length,
      })
      for (const entityId of commit.archiveDevisIds as string[]) {
        state.committedItems.push({ entityType: 'devis', entityId, action: 'archived' })
      }
      for (const task of commit.cancelTasks as Array<{ id: string; status: string }>) {
        state.committedItems.push({
          entityType: 'task',
          entityId: task.id,
          action: 'cancelled',
          previousStatus: task.status,
        })
      }
      for (const reminder of commit.cancelReminders as Array<{ id: string; status: string }>) {
        state.committedItems.push({
          entityType: 'reminder',
          entityId: reminder.id,
          action: 'cancelled',
          previousStatus: reminder.status,
        })
      }
      return id
    },
    async persistRestore(params: { operationId: string }) {
      state.calls.push('persistRestore')
      state.restoredOperationIds.push(params.operationId)
      const items = (options.existingItems ?? []).filter(
        (item) => item.operationId === params.operationId,
      )
      const operation = state.operations.find((entry) => entry.id === params.operationId)
      if (operation) operation.status = 'reversed'
      return items.length
    },
    async countAdjustmentsForOperation(operationId: string) {
      state.calls.push('countAdjustments')
      return state.operations.find((operation) => operation.id === operationId)?.adjustments ?? 0
    },
    async createFollowUp(params: { archivedProjectId: string }) {
      state.calls.push('createFollowUp')
      const project = {
        id: 'project-2',
        reference: 'PRJ-002',
        predecessor_project_id: params.archivedProjectId,
        status: 'draft',
      }
      state.followUps.push(project)
      return project
    },
    async listLegacyArchives() {
      state.calls.push('listLegacyArchives')
      return []
    },
  } as unknown as ClosureRepository

  return { repository, state }
}

function closeInput(
  snapshot: ClosureSnapshot,
  invoiceResolutions: CloseProjectInput['invoiceResolutions'] = [],
  overrides: Partial<CloseProjectInput> = {},
): CloseProjectInput {
  return {
    closureType: 'client_abandoned',
    reason: 'Le client a abandonné le projet en cours.',
    closureVersion: snapshot.project.closureVersion,
    previewFingerprint: closureFingerprint(snapshot),
    invoiceResolutions,
    ...overrides,
  }
}

const badDebt = (amount: number): CloseProjectInput['invoiceResolutions'] => [
  {
    invoiceId: 'invoice-open',
    type: 'bad_debt',
    amount,
    reason: 'Créance abandonnée après relances',
    managerAttestation: true,
  },
]

test.afterEach(() => {
  resetClosureRepository()
})

test('the project lock is acquired before the snapshot is reloaded', async () => {
  const snapshot = snapshotFixture()
  const { repository, state } = createFakeRepository({ snapshot })
  setClosureRepository(repository)

  await closeAndArchiveProject('project-1', closeInput(snapshot, badDebt(200_000)), ACTOR, KEY_A)

  assert.equal(state.calls[0], 'lock')
  assert.ok(state.calls.indexOf('lock') < state.calls.indexOf('loadSnapshot'))
  assert.ok(state.calls.indexOf('loadSnapshot') < state.calls.indexOf('persistClosure'))
})

test('a stale closure version is rejected', async () => {
  const snapshot = snapshotFixture()
  const { repository } = createFakeRepository({ snapshot })
  setClosureRepository(repository)

  await assert.rejects(
    closeAndArchiveProject(
      'project-1',
      closeInput(snapshot, badDebt(200_000), { closureVersion: 1 }),
      ACTOR,
      KEY_A,
    ),
    (error: unknown) =>
      error instanceof ClosurePolicyError && error.code === 'CLOSURE_PREVIEW_STALE',
  )
})

test('a stale preview fingerprint is rejected', async () => {
  const snapshot = snapshotFixture()
  const { repository } = createFakeRepository({ snapshot })
  setClosureRepository(repository)

  await assert.rejects(
    closeAndArchiveProject(
      'project-1',
      closeInput(snapshot, badDebt(200_000), { previewFingerprint: `sha256:${'0'.repeat(64)}` }),
      ACTOR,
      KEY_A,
    ),
    (error: unknown) =>
      error instanceof ClosurePolicyError && error.code === 'CLOSURE_PREVIEW_STALE',
  )
})

test('grouped resolutions must sum exactly to the remaining balance', async () => {
  const snapshot = snapshotFixture()
  const { repository } = createFakeRepository({ snapshot })
  setClosureRepository(repository)

  await assert.rejects(
    closeAndArchiveProject('project-1', closeInput(snapshot, badDebt(150_000)), ACTOR, KEY_A),
    (error: unknown) =>
      error instanceof ClosurePolicyError && error.code === 'INVOICE_RESOLUTION_MISMATCH',
  )

  const mixed = closeInput(snapshot, [
    {
      invoiceId: 'invoice-open',
      type: 'credit_note',
      amount: 120_000,
      reason: 'Prestation non réalisée',
      externalReference: 'AV-2026-014',
    },
    {
      invoiceId: 'invoice-open',
      type: 'bad_debt',
      amount: 80_000,
      reason: 'Solde irrécouvrable',
      managerAttestation: true,
    },
  ])
  const result = await closeAndArchiveProject('project-1', mixed, ACTOR, KEY_A)
  assert.equal(result.summary.invoiceAdjustments, 2)
  assert.equal(result.restorable, false)
})

test('a failure during persistence leaves no committed state', async () => {
  const snapshot = snapshotFixture()
  const { repository, state } = createFakeRepository({
    snapshot,
    throwOnPersist: new Error('child update failed'),
  })
  setClosureRepository(repository)

  await assert.rejects(
    closeAndArchiveProject('project-1', closeInput(snapshot, badDebt(200_000)), ACTOR, KEY_A),
    /child update failed/,
  )

  assert.deepEqual(state.operations, [])
  assert.deepEqual(state.committedItems, [])
  assert.ok(state.calls.includes('rollback'))
})

test('a repeated idempotency key returns the first result without a new closure', async () => {
  const snapshot = snapshotFixture()
  const { repository, state } = createFakeRepository({ snapshot })
  setClosureRepository(repository)
  const input = closeInput(snapshot, badDebt(200_000))

  const first = await closeAndArchiveProject('project-1', input, ACTOR, KEY_A)
  const second = await closeAndArchiveProject('project-1', input, ACTOR, KEY_A)

  assert.equal(second.operationId, first.operationId)
  assert.equal(state.operations.length, 1)
  assert.equal(state.calls.filter((call) => call === 'persistClosure').length, 1)
})

test('a different payload reusing an idempotency key conflicts', async () => {
  const snapshot = snapshotFixture()
  const { repository } = createFakeRepository({ snapshot })
  setClosureRepository(repository)

  await closeAndArchiveProject('project-1', closeInput(snapshot, badDebt(200_000)), ACTOR, KEY_A)

  await assert.rejects(
    closeAndArchiveProject(
      'project-1',
      closeInput(snapshot, badDebt(200_000), { closureType: 'mutual_termination' }),
      ACTOR,
      KEY_A,
    ),
    (error: unknown) =>
      error instanceof ClosurePolicyError && error.code === 'IDEMPOTENCY_CONFLICT',
  )
})

test('the request hash ignores resolution ordering but not content', () => {
  const snapshot = snapshotFixture()
  const first = closeInput(snapshot, [
    { invoiceId: 'invoice-open', type: 'bad_debt', amount: 80_000, reason: 'a', managerAttestation: true },
    { invoiceId: 'invoice-open', type: 'credit_note', amount: 120_000, reason: 'b', externalReference: 'AV-1' },
  ])
  const reordered = closeInput(snapshot, [first.invoiceResolutions[1], first.invoiceResolutions[0]])
  const changed = closeInput(snapshot, [
    { ...first.invoiceResolutions[0], amount: 90_000 },
    first.invoiceResolutions[1],
  ])

  assert.equal(requestHash('project-1', first), requestHash('project-1', reordered))
  assert.notEqual(requestHash('project-1', first), requestHash('project-1', changed))
})

test('restore succeeds only for a closure without financial adjustment', async () => {
  const snapshot = snapshotFixture({
    invoices: [
      {
        id: 'invoice-paid',
        status: 'paid',
        total: 100_000,
        amountPaid: 100_000,
        currency: 'FCFA',
        isArchived: false,
      },
    ],
  })
  const { repository, state } = createFakeRepository({ snapshot })
  setClosureRepository(repository)

  const closure = await closeAndArchiveProject('project-1', closeInput(snapshot), ACTOR, KEY_A)
  assert.equal(closure.restorable, true)

  const restored = await restoreClosedProject('project-1', ACTOR)
  assert.equal(restored.operationId, closure.operationId)
  assert.deepEqual(state.restoredOperationIds, [closure.operationId])
})

test('cancelled tasks and reminders record their original status', async () => {
  const snapshot = snapshotFixture({
    invoices: [],
    tasks: [
      { id: 'task-todo', status: 'todo' },
      { id: 'task-progress', status: 'in_progress' },
      { id: 'task-blocked', status: 'blocked' },
      { id: 'task-done', status: 'done' },
    ],
    reminders: [
      { id: 'reminder-draft', status: 'draft' },
      { id: 'reminder-scheduled', status: 'scheduled' },
      { id: 'reminder-sent', status: 'sent' },
    ],
  })
  const { repository, state } = createFakeRepository({ snapshot })
  setClosureRepository(repository)

  await closeAndArchiveProject('project-1', closeInput(snapshot), ACTOR, KEY_A)

  // Sans le statut d'origine, la restauration rendrait « todo » à une tâche
  // qui était « in_progress ».
  const statusOf = (entityId: string) =>
    state.committedItems.find((item) => item.entityId === entityId)?.previousStatus

  assert.equal(statusOf('task-todo'), 'todo')
  assert.equal(statusOf('task-progress'), 'in_progress')
  assert.equal(statusOf('task-blocked'), 'blocked')
  assert.equal(statusOf('task-done'), undefined, 'a done task is never cancelled')
  assert.equal(statusOf('reminder-draft'), 'draft')
  assert.equal(statusOf('reminder-scheduled'), 'scheduled')
  assert.equal(statusOf('reminder-sent'), undefined, 'a sent reminder is never cancelled')
})

test('restore replays only the items of the selected operation', async () => {
  const { repository, state } = createFakeRepository({
    existingOperations: [
      {
        id: 'operation-earlier',
        projectId: 'project-1',
        idempotencyKey: KEY_B,
        requestHash: 'hash-earlier',
        status: 'reversed',
        summary: {},
        adjustments: 0,
      },
      {
        id: 'operation-current',
        projectId: 'project-1',
        idempotencyKey: KEY_A,
        requestHash: 'hash-current',
        status: 'completed',
        summary: {},
        adjustments: 0,
      },
    ],
    existingItems: [
      { operationId: 'operation-earlier', entityType: 'devis', entityId: 'devis-old', action: 'archived' },
      { operationId: 'operation-current', entityType: 'devis', entityId: 'devis-1', action: 'archived' },
      { operationId: 'operation-current', entityType: 'task', entityId: 'task-1', action: 'cancelled' },
    ],
  })
  setClosureRepository(repository)

  const restored = await restoreClosedProject('project-1', ACTOR)

  assert.equal(restored.operationId, 'operation-current')
  assert.equal(restored.restoredEntities, 2)
  assert.deepEqual(state.restoredOperationIds, ['operation-current'])
})

test('restore is forbidden after a credit note or a bad debt', async () => {
  const snapshot = snapshotFixture()
  const { repository } = createFakeRepository({ snapshot })
  setClosureRepository(repository)

  await closeAndArchiveProject('project-1', closeInput(snapshot, badDebt(200_000)), ACTOR, KEY_A)

  await assert.rejects(
    restoreClosedProject('project-1', ACTOR),
    (error: unknown) =>
      error instanceof ClosurePolicyError && error.code === 'PROJECT_RESTORE_FORBIDDEN',
  )
})

test('restore is forbidden when no completed closure exists', async () => {
  const { repository } = createFakeRepository({})
  setClosureRepository(repository)

  await assert.rejects(
    restoreClosedProject('project-1', ACTOR),
    (error: unknown) =>
      error instanceof ClosurePolicyError && error.code === 'PROJECT_RESTORE_FORBIDDEN',
  )
})

test('a follow-up project requires a sealed archive', async () => {
  const active = snapshotFixture()
  const { repository } = createFakeRepository({ snapshot: active, hasCompletedClosure: false })
  setClosureRepository(repository)

  await assert.rejects(
    createFollowUpProject('project-1', ACTOR),
    (error: unknown) =>
      error instanceof ClosurePolicyError && error.code === 'PROJECT_NOT_ARCHIVED',
  )
})

test('a follow-up project copies only descriptive context', async () => {
  const archived = snapshotFixture({
    project: { id: 'project-1', reference: 'PRJ-001', closureVersion: 3, isArchived: true },
  })
  const { repository, state } = createFakeRepository({
    snapshot: archived,
    hasCompletedClosure: true,
  })
  setClosureRepository(repository)

  const project = await createFollowUpProject('project-1', ACTOR)

  assert.equal(project.predecessor_project_id, 'project-1')
  assert.equal(project.reference, 'PRJ-002')
  assert.notEqual(project.reference, 'PRJ-001')
  assert.equal(state.followUps.length, 1)
  for (const forbidden of ['invoices', 'devis', 'payments', 'expenses', 'contracts']) {
    assert.equal(project[forbidden], undefined)
  }
})

test('reconciliation regularizes a legacy archive and refuses an active project', async () => {
  const legacy = snapshotFixture({
    project: { id: 'project-1', reference: 'PRJ-001', closureVersion: 0, isArchived: true },
    invoices: [],
  })
  const { repository, state } = createFakeRepository({
    snapshot: legacy,
    hasCompletedClosure: false,
  })
  setClosureRepository(repository)

  const result = await reconcileLegacyArchive('project-1', closeInput(legacy), ACTOR, KEY_A)
  assert.equal(state.operations.length, 1)
  assert.equal(result.projectId, 'project-1')

  const active = snapshotFixture()
  const activeFake = createFakeRepository({ snapshot: active })
  setClosureRepository(activeFake.repository)

  await assert.rejects(
    reconcileLegacyArchive('project-1', closeInput(active, badDebt(200_000)), ACTOR, KEY_B),
    (error: unknown) =>
      error instanceof ClosurePolicyError && error.code === 'PROJECT_NOT_ARCHIVED',
  )
})

test('reconciliation refuses a project already closed through the lifecycle', async () => {
  const archived = snapshotFixture({
    project: { id: 'project-1', reference: 'PRJ-001', closureVersion: 1, isArchived: true },
    invoices: [],
  })
  const { repository } = createFakeRepository({ snapshot: archived, hasCompletedClosure: true })
  setClosureRepository(repository)

  await assert.rejects(
    reconcileLegacyArchive('project-1', closeInput(archived), ACTOR, KEY_A),
    (error: unknown) =>
      error instanceof ClosurePolicyError && error.code === 'PROJECT_ALREADY_CLOSED',
  )
})
