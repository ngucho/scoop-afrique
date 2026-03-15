import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { createProjectSchema, updateProjectSchema } from '../../schemas/crm/project.schema.js'
import * as projectService from '../../services/crm/project.service.js'
import * as taskService from '../../services/crm/task.service.js'
import * as deliverableService from '../../services/crm/deliverable.service.js'
import * as expenseService from '../../services/crm/expense.service.js'
import { createTaskSchema, updateTaskSchema } from '../../schemas/crm/task.schema.js'
import {
  createDeliverableSchema,
  updateDeliverableSchema,
  deliverableMetricsSchema,
} from '../../schemas/crm/deliverable.schema.js'
import { createExpenseSchema } from '../../schemas/crm/expense.schema.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const contactId = c.req.query('contact_id')
  const status = c.req.query('status')
  const withContact = c.req.query('with_contact') === 'true'
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Number(c.req.query('offset')) || 0

  const { data, total } = await projectService.listProjects({
    contactId: contactId || undefined,
    status: status || undefined,
    withContact,
    limit,
    offset,
  })
  return c.json({ data, total })
})

app.post('/', requireRole('manager', 'admin'), async (c) => {
  const user = c.get('user')
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const project = await projectService.createProject(parsed.data, user.id)
  return c.json({ data: project }, 201)
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const project = await projectService.getProjectById(id)
  if (!project) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: project })
})

app.get('/:id/folder', async (c) => {
  const id = c.req.param('id')
  const folder = await projectService.getProjectFolder(id)
  if (!folder) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: folder })
})

app.patch('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const project = await projectService.getProjectById(id)
  if (!project) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updateProjectSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const updated = await projectService.updateProject(id, parsed.data, user.id)
  return c.json({ data: updated })
})

app.post('/:id/close', requireRole('manager', 'admin'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const project = await projectService.getProjectById(id)
  if (!project) return c.json({ error: 'Not found' }, 404)
  const updated = await projectService.closeProject(id, user.id)
  return c.json({ data: updated })
})

// Project Contacts (many-to-many)
app.get('/:id/contacts', async (c) => {
  const id = c.req.param('id')
  const contacts = await projectService.getProjectContacts(id)
  return c.json({ data: contacts })
})

app.post('/:id/contacts', async (c) => {
  const id = c.req.param('id')
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }
  const { contact_id, role, is_primary } = body as Record<string, unknown>
  if (!contact_id) return c.json({ error: 'contact_id required' }, 400)
  const link = await projectService.addProjectContact(
    id,
    String(contact_id),
    String(role ?? 'client'),
    Boolean(is_primary)
  )
  return c.json({ data: link }, 201)
})

app.delete('/:id/contacts/:contactId', async (c) => {
  const id = c.req.param('id')
  const contactId = c.req.param('contactId')
  await projectService.removeProjectContact(id, contactId)
  return c.json({ success: true })
})

// Tasks
app.get('/:id/tasks', async (c) => {
  const id = c.req.param('id')
  const project = await projectService.getProjectById(id)
  if (!project) return c.json({ error: 'Not found' }, 404)
  const tasks = await taskService.listTasksByProject(id)
  return c.json({ data: tasks })
})

app.post('/:id/tasks', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const project = await projectService.getProjectById(id)
  if (!project) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const task = await taskService.createTask(id, parsed.data, user.id)
  return c.json({ data: task }, 201)
})

// Deliverables
app.get('/:id/deliverables', async (c) => {
  const id = c.req.param('id')
  const project = await projectService.getProjectById(id)
  if (!project) return c.json({ error: 'Not found' }, 404)
  const deliverables = await deliverableService.listDeliverablesByProject(id)
  return c.json({ data: deliverables })
})

app.post('/:id/deliverables', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const project = await projectService.getProjectById(id)
  if (!project) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = createDeliverableSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const deliverable = await deliverableService.createDeliverable(id, parsed.data, user.id)
  return c.json({ data: deliverable }, 201)
})

// Expenses
app.get('/:id/expenses', async (c) => {
  const id = c.req.param('id')
  const project = await projectService.getProjectById(id)
  if (!project) return c.json({ error: 'Not found' }, 404)
  const expenses = await expenseService.listExpensesByProject(id)
  return c.json({ data: expenses })
})

app.post('/:id/expenses', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const project = await projectService.getProjectById(id)
  if (!project) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = createExpenseSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const expense = await expenseService.createExpense(id, parsed.data, user.id)
  return c.json({ data: expense }, 201)
})

export default app
