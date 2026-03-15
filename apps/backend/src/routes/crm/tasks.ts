import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { updateTaskSchema } from '../../schemas/crm/task.schema.js'
import * as taskService from '../../services/crm/task.service.js'
import * as projectService from '../../services/crm/project.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.patch('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const task = await taskService.getTaskById(id)
  if (!task) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const updated = await taskService.updateTask(id, parsed.data, user.id)
  return c.json({ data: updated })
})

app.delete('/:id', requireRole('manager', 'admin'), async (c) => {
  const id = c.req.param('id')
  const task = await taskService.getTaskById(id)
  if (!task) return c.json({ error: 'Not found' }, 404)
  await taskService.deleteTask(id)
  return c.json({ data: { id, deleted: true } })
})

export default app
