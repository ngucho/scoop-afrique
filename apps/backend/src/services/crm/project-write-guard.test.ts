import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertEntityProjectWritable,
  assertInvoiceProjectWritable,
  assertProjectWritable,
  ProjectArchivedError,
  resetProjectWriteGuardGateway,
  setProjectWriteGuardGateway,
  type GuardedEntity,
  type ProjectWriteGuardGateway,
} from './project-write-guard.js'

const ARCHIVED = 'project-archived'
const ACTIVE = 'project-active'

interface FakeLinks {
  invoices?: Record<string, string | null>
  devis?: Record<string, string | null>
  contracts?: Record<string, string | null>
  tasks?: Record<string, string | null>
  deliverables?: Record<string, string | null>
  treasury?: Record<string, string | null>
  expenses?: Record<string, string | null>
  payments?: Record<string, string>
  reminders?: Record<string, { projectId?: string | null; invoiceId?: string | null }>
}

function fakeGateway(links: FakeLinks): ProjectWriteGuardGateway {
  const resolve = async (entity: GuardedEntity, entityId: string): Promise<string | null> => {
    switch (entity) {
      case 'invoice':
        return links.invoices?.[entityId] ?? null
      case 'devis':
        return links.devis?.[entityId] ?? null
      case 'contract':
        return links.contracts?.[entityId] ?? null
      case 'task':
        return links.tasks?.[entityId] ?? null
      case 'deliverable':
        return links.deliverables?.[entityId] ?? null
      case 'treasury':
        return links.treasury?.[entityId] ?? null
      case 'expense':
        return links.expenses?.[entityId] ?? null
      case 'payment': {
        const invoiceId = links.payments?.[entityId]
        return invoiceId ? resolve('invoice', invoiceId) : null
      }
      case 'reminder': {
        const reminder = links.reminders?.[entityId]
        if (!reminder) return null
        if (reminder.projectId) return reminder.projectId
        if (reminder.invoiceId) return resolve('invoice', reminder.invoiceId)
        return null
      }
    }
  }

  return {
    async isProjectArchived(projectId) {
      return projectId === ARCHIVED
    },
    resolveProjectId: resolve,
  }
}

test.afterEach(() => {
  resetProjectWriteGuardGateway()
})

test('an active project permits mutation', async () => {
  setProjectWriteGuardGateway(fakeGateway({}))
  await assertProjectWritable(ACTIVE)
})

test('an archived project refuses mutation', async () => {
  setProjectWriteGuardGateway(fakeGateway({}))
  await assert.rejects(
    assertProjectWritable(ARCHIVED),
    (error: unknown) => error instanceof ProjectArchivedError && error.code === 'PROJECT_ARCHIVED',
  )
})

test('a payment resolves its project through its invoice', async () => {
  setProjectWriteGuardGateway(
    fakeGateway({
      payments: { 'payment-1': 'invoice-1' },
      invoices: { 'invoice-1': ARCHIVED },
    }),
  )

  await assert.rejects(
    assertEntityProjectWritable('payment', 'payment-1'),
    ProjectArchivedError,
  )
})

test('a reminder resolves its direct project first, then its invoice', async () => {
  setProjectWriteGuardGateway(
    fakeGateway({
      reminders: {
        'reminder-direct': { projectId: ARCHIVED, invoiceId: 'invoice-active' },
        'reminder-by-invoice': { projectId: null, invoiceId: 'invoice-archived' },
        'reminder-free': { projectId: null, invoiceId: null },
      },
      invoices: { 'invoice-active': ACTIVE, 'invoice-archived': ARCHIVED },
    }),
  )

  await assert.rejects(
    assertEntityProjectWritable('reminder', 'reminder-direct'),
    ProjectArchivedError,
  )
  await assert.rejects(
    assertEntityProjectWritable('reminder', 'reminder-by-invoice'),
    ProjectArchivedError,
  )
  await assertEntityProjectWritable('reminder', 'reminder-free')
})

test('an unlinked invoice, devis or contract remains writable', async () => {
  setProjectWriteGuardGateway(
    fakeGateway({
      invoices: { 'invoice-free': null },
      devis: { 'devis-free': null },
      contracts: { 'contract-free': null },
    }),
  )

  await assertEntityProjectWritable('invoice', 'invoice-free')
  await assertEntityProjectWritable('devis', 'devis-free')
  await assertEntityProjectWritable('contract', 'contract-free')
})

test('a treasury movement linked to an archived project is immutable', async () => {
  setProjectWriteGuardGateway(fakeGateway({ treasury: { 'movement-1': ARCHIVED } }))

  await assert.rejects(
    assertEntityProjectWritable('treasury', 'movement-1'),
    ProjectArchivedError,
  )
})

test('a treasury movement without a project stays writable', async () => {
  setProjectWriteGuardGateway(fakeGateway({ treasury: { 'movement-free': null } }))
  await assertEntityProjectWritable('treasury', 'movement-free')
})

test('the invoice shortcut refuses a payment on an archived folder', async () => {
  setProjectWriteGuardGateway(fakeGateway({ invoices: { 'invoice-1': ARCHIVED } }))
  await assert.rejects(assertInvoiceProjectWritable('invoice-1'), ProjectArchivedError)
})

test('a missing identifier is a no-op rather than a hidden refusal', async () => {
  setProjectWriteGuardGateway(fakeGateway({}))
  await assertProjectWritable(null)
  await assertProjectWritable(undefined)
  await assertEntityProjectWritable('task', null)
  await assertInvoiceProjectWritable(undefined)
})

test('tasks, deliverables and expenses of an archived project are frozen', async () => {
  setProjectWriteGuardGateway(
    fakeGateway({
      tasks: { 'task-1': ARCHIVED },
      deliverables: { 'deliverable-1': ARCHIVED },
      expenses: { 'expense-1': ARCHIVED },
    }),
  )

  for (const [entity, id] of [
    ['task', 'task-1'],
    ['deliverable', 'deliverable-1'],
    ['expense', 'expense-1'],
  ] as Array<[GuardedEntity, string]>) {
    await assert.rejects(assertEntityProjectWritable(entity, id), ProjectArchivedError)
  }
})
