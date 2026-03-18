import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { createContactSchema, updateContactSchema } from '../../schemas/crm/contact.schema.js'
import * as contactService from '../../services/crm/contact.service.js'
import * as organizationService from '../../services/crm/organization.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const user = c.get('user')
  const type = c.req.query('type')
  const search = c.req.query('search')
  const archived = c.req.query('archived')
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Number(c.req.query('offset')) || 0

  const { data, total } = await contactService.listContacts({
    type: type || undefined,
    search: search || undefined,
    archived: archived === 'true' ? true : archived === 'false' ? false : undefined,
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
  const parsed = createContactSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const contact = await contactService.createContact(parsed.data, user.id)
  return c.json({ data: contact }, 201)
})

app.get('/by-email', async (c) => {
  const email = c.req.query('email')
  if (!email?.trim()) return c.json({ error: 'email query required' }, 400)
  const contact = await contactService.getContactByEmail(email.trim())
  if (!contact) return c.json({ data: null }, 200)
  return c.json({ data: contact })
})

app.get('/:id/organizations', async (c) => {
  const id = c.req.param('id')
  const contact = await contactService.getContactById(id)
  if (!contact) return c.json({ error: 'Not found' }, 404)
  const orgs = await organizationService.getContactOrganizations(id)
  return c.json({ data: orgs })
})

app.post('/:id/organizations', async (c) => {
  const id = c.req.param('id')
  const contact = await contactService.getContactById(id)
  if (!contact) return c.json({ error: 'Not found' }, 404)
  let body: { organization_id: string; role?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  if (!body.organization_id) return c.json({ error: 'organization_id required' }, 400)
  await organizationService.linkContactOrganization(id, body.organization_id, body.role)
  const orgs = await organizationService.getContactOrganizations(id)
  return c.json({ data: orgs }, 201)
})

app.delete('/:id/organizations/:orgId', async (c) => {
  const id = c.req.param('id')
  const orgId = c.req.param('orgId')
  const contact = await contactService.getContactById(id)
  if (!contact) return c.json({ error: 'Not found' }, 404)
  await organizationService.unlinkContactOrganization(id, orgId)
  return c.json({ data: { unlinked: true } })
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const contact = await contactService.getContactById(id)
  if (!contact) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: contact })
})

app.patch('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const contact = await contactService.getContactById(id)
  if (!contact) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updateContactSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const updated = await contactService.updateContact(id, parsed.data, user.id)
  return c.json({ data: updated })
})

app.delete('/:id', requireRole('admin'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const contact = await contactService.getContactById(id)
  if (!contact) return c.json({ error: 'Not found' }, 404)
  await contactService.archiveContact(id, user.id)
  return c.json({ data: { id, archived: true } })
})

// Admin restore (undo archive)
app.post('/:id/restore', requireRole('admin'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const contact = await contactService.getContactById(id)
  if (!contact) return c.json({ error: 'Not found' }, 404)
  const restored = await contactService.updateContact(id, { is_archived: false }, user.id)
  return c.json({ data: restored })
})

export default app
