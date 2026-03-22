import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { createOrganizationSchema, updateOrganizationSchema } from '../../schemas/crm/organization.schema.js'
import * as organizationService from '../../services/crm/organization.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const search = c.req.query('search')
  const type = c.req.query('type')
  const country = c.req.query('country')
  const sort = c.req.query('sort') as 'name' | 'created_at' | undefined
  const order = c.req.query('order') as 'asc' | 'desc' | undefined
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Number(c.req.query('offset')) || 0

  const { data, total } = await organizationService.listOrganizations({
    search: search || undefined,
    type: type || undefined,
    country: country || undefined,
    sort: sort || undefined,
    order: order || undefined,
    limit,
    offset,
  })
  return c.json({ data, total })
})

app.post('/', async (c) => {
  const user = c.get('user')
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = createOrganizationSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const org = await organizationService.createOrganization(parsed.data, user.id)
  return c.json({ data: org }, 201)
})

app.get('/:id/contacts', async (c) => {
  const id = c.req.param('id')
  const org = await organizationService.getOrganizationById(id)
  if (!org) return c.json({ error: 'Not found' }, 404)
  const contacts = await organizationService.getOrganizationContacts(id)
  return c.json({ data: contacts })
})

app.post('/:id/contacts', async (c) => {
  const id = c.req.param('id')
  const org = await organizationService.getOrganizationById(id)
  if (!org) return c.json({ error: 'Not found' }, 404)
  let body: { contact_id: string; role?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  if (!body.contact_id) return c.json({ error: 'contact_id required' }, 400)
  await organizationService.linkContactOrganization(body.contact_id, id, body.role)
  const contacts = await organizationService.getOrganizationContacts(id)
  return c.json({ data: contacts }, 201)
})

app.delete('/:id/contacts/:contactId', async (c) => {
  const id = c.req.param('id')
  const contactId = c.req.param('contactId')
  const org = await organizationService.getOrganizationById(id)
  if (!org) return c.json({ error: 'Not found' }, 404)
  await organizationService.unlinkContactOrganization(contactId, id)
  return c.json({ data: { unlinked: true } })
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const org = await organizationService.getOrganizationById(id)
  if (!org) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: org })
})

app.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const org = await organizationService.getOrganizationById(id)
  if (!org) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updateOrganizationSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const updated = await organizationService.updateOrganization(id, parsed.data)
  return c.json({ data: updated })
})

export default app
