/**
 * Preuve de bout en bout : sur un dossier archivé, toutes les routes de
 * mutation CRM répondent 409 tandis que les lectures restent servies.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { Hono } from 'hono'
import contractsRoutes from './contracts.js'
import deliverablesRoutes from './deliverables.js'
import devisRoutes from './devis.js'
import invoicesRoutes from './invoices.js'
import projectsRoutes from './projects.js'
import remindersRoutes from './reminders.js'
import tasksRoutes from './tasks.js'
import treasuryRoutes from './treasury.js'
import {
  crmErrorHandler,
  resetProjectWriteGuardGateway,
  setProjectWriteGuardGateway,
} from '../../services/crm/project-write-guard.js'
import {
  resetClosureRepository,
  setClosureRepository,
} from '../../services/crm/project-closure.service.js'
import type { AppEnv } from '../../types.js'

const ARCHIVED_PROJECT = 'project-archived'

function buildApp() {
  const app = new Hono<AppEnv>()
  app.onError(crmErrorHandler)
  app.use('*', async (c, next) => {
    c.set('user', {
      id: 'manager-1',
      permissions: ['read:crm', 'write:crm', 'manage:crm'],
    } as never)
    await next()
  })
  app.route('/projects', projectsRoutes)
  app.route('/tasks', tasksRoutes)
  app.route('/deliverables', deliverablesRoutes)
  app.route('/devis', devisRoutes)
  app.route('/invoices', invoicesRoutes)
  app.route('/contracts', contractsRoutes)
  app.route('/reminders', remindersRoutes)
  app.route('/treasury', treasuryRoutes)
  return app
}

/** Tout est rattaché au dossier archivé : aucune requête ne doit toucher la base. */
function archivedGateway() {
  setProjectWriteGuardGateway({
    async isProjectArchived() {
      return true
    },
    async resolveProjectId() {
      return ARCHIVED_PROJECT
    },
  })
}

const json = (body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

const patch = (body: unknown) => ({ ...json(body), method: 'PATCH' })

test.afterEach(() => {
  resetProjectWriteGuardGateway()
})

test('every mutation on an archived folder is refused with 409 PROJECT_ARCHIVED', async () => {
  archivedGateway()
  const app = buildApp()

  const cases: Array<[string, RequestInit]> = [
    [`/projects/${ARCHIVED_PROJECT}`, patch({ title: 'Nouveau titre' })],
    [`/projects/${ARCHIVED_PROJECT}/contacts`, json({ contact_id: 'contact-1' })],
    [`/projects/${ARCHIVED_PROJECT}/contacts/contact-1`, { method: 'DELETE' }],
    [`/projects/${ARCHIVED_PROJECT}/tasks`, json({ title: 'Nouvelle tâche' })],
    [`/projects/${ARCHIVED_PROJECT}/deliverables`, json({ title: 'Livrable' })],
    [`/projects/${ARCHIVED_PROJECT}/expenses`, json({ title: 'Dépense', amount: 1000 })],
    ['/tasks/task-1', patch({ status: 'done' })],
    ['/tasks/task-1', { method: 'DELETE' }],
    ['/deliverables/deliverable-1', patch({ title: 'Livrable' })],
    ['/deliverables/deliverable-1/metrics', json({ views: 10 })],
    ['/devis/devis-1', patch({ title: 'Devis' })],
    ['/devis/devis-1', { method: 'DELETE' }],
    ['/devis/devis-1/send', { method: 'POST' }],
    ['/devis/devis-1/convert', { method: 'POST' }],
    ['/invoices/invoice-1', patch({ notes: 'note' })],
    ['/invoices/invoice-1', { method: 'DELETE' }],
    ['/invoices/invoice-1/send', { method: 'POST' }],
    ['/invoices/invoice-1/payments', json({ amount: 1000 })],
    ['/invoices/invoice-1/payments/payment-1', patch({ amount: 2000 })],
    ['/contracts/contract-1', patch({ title: 'Contrat' })],
    ['/contracts/contract-1', { method: 'DELETE' }],
    ['/contracts/contract-1/sign', { method: 'PATCH' }],
    ['/reminders/reminder-1', patch({ message: 'Relance' })],
    ['/reminders/reminder-1/send', { method: 'POST' }],
    ['/treasury/movement-1', patch({ amount: 5000 })],
    ['/treasury/movement-1', { method: 'DELETE' }],
  ]

  for (const [path, init] of cases) {
    const response = await app.request(path, init)
    assert.equal(response.status, 409, `${init.method ?? 'GET'} ${path} should be refused`)
    const body = (await response.json()) as { error: string }
    assert.equal(body.error, 'PROJECT_ARCHIVED', `${path} should report PROJECT_ARCHIVED`)
  }
})

test('reads and downloads of an archived folder are never blocked by the guard', async () => {
  // Le garde ne doit intervenir sur aucune lecture : les documents historiques
  // et leurs PDF restent consultables après archivage.
  let guardCalls = 0
  setProjectWriteGuardGateway({
    async isProjectArchived() {
      guardCalls += 1
      return true
    },
    async resolveProjectId() {
      guardCalls += 1
      return ARCHIVED_PROJECT
    },
  })
  const app = buildApp()

  for (const path of [
    `/projects/${ARCHIVED_PROJECT}`,
    `/projects/${ARCHIVED_PROJECT}/contacts`,
    `/projects/${ARCHIVED_PROJECT}/tasks`,
    '/invoices/invoice-1/pdf',
    '/devis/devis-1/pdf',
  ]) {
    // La lecture atteint la couche données (absente ici) au lieu d'être
    // arrêtée en 409 : c'est la preuve que la garde ne s'applique pas.
    const outcome = await Promise.resolve(app.request(path)).then(
      (response: Response) => `status:${response.status}`,
      (error: Error) => `threw:${error.message}`,
    )
    assert.notEqual(outcome, 'status:409', `${path} must not be refused by the guard`)
  }
  assert.equal(guardCalls, 0)
})

test('legacy archive, close and restore routes require the closure assistant', async () => {
  archivedGateway()
  const app = buildApp()

  for (const [path, method] of [
    [`/projects/${ARCHIVED_PROJECT}`, 'DELETE'],
    [`/projects/${ARCHIVED_PROJECT}/close`, 'POST'],
  ] as Array<[string, string]>) {
    const response = await app.request(path, { method })
    const body = (await response.json()) as { error: string; message: string }
    assert.equal(response.status, 409)
    assert.equal(body.error, 'PROJECT_CLOSURE_REQUIRED')
    assert.match(body.message, /Clore et archiver/)
  }
})

test('the legacy restore route delegates to the closure service', async () => {
  archivedGateway()
  let restoreCalls = 0
  setClosureRepository({
    async withProjectLock(_projectId: string, fn: (handle: unknown) => Promise<unknown>) {
      return fn({}) as never
    },
    async findLatestCompletedOperation() {
      restoreCalls += 1
      // Aucune clôture réversible : le service refuse et la route ne peut donc
      // jamais désarchiver directement.
      return null
    },
  } as never)
  const app = buildApp()

  const response = await app.request(`/projects/${ARCHIVED_PROJECT}/restore`, { method: 'POST' })
  const body = (await response.json()) as { error: string }

  assert.equal(response.status, 409)
  assert.equal(body.error, 'PROJECT_RESTORE_FORBIDDEN')
  assert.equal(restoreCalls, 1)
  resetClosureRepository()
})
