import { Hono } from 'hono'
import { createContractSchema, updateContractSchema } from '../../schemas/crm/contract.schema.js'
import * as contractService from '../../services/crm/contract.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.get('/', async (c) => {
  const user = c.get('user')
  const canManageCrm = user.permissions.includes('manage:crm')
  const projectId = c.req.query('project_id')
  const contactId = c.req.query('contact_id')
  const status = c.req.query('status')
  const archivedQuery = c.req.query('archived')
  const archived =
    archivedQuery === 'true'
      ? canManageCrm
        ? true
        : undefined
      : archivedQuery === 'false'
        ? false
        : undefined
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Number(c.req.query('offset')) || 0
  const search = (c.req.query('search') || c.req.query('q') || '').trim() || undefined

  const { data, total } = await contractService.listContracts({
    projectId: projectId || undefined,
    contactId: contactId || undefined,
    status: status || undefined,
    archived,
    limit,
    offset,
    search,
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
  const parsed = createContractSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const contract = await contractService.createContract(parsed.data, user.id)
  return c.json({ data: contract }, 201)
})

app.get('/:id', async (c) => {
  const user = c.get('user')
  const canManageCrm = user.permissions.includes('manage:crm')
  const id = c.req.param('id')
  const contract = await contractService.getContractById(id)
  if (!contract) return c.json({ error: 'Not found' }, 404)
  if (Boolean((contract as Record<string, unknown>)['is_archived']) && !canManageCrm)
    return c.json({ error: 'Not found' }, 404)
  return c.json({ data: contract })
})

app.patch('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const contract = await contractService.getContractById(id)
  if (!contract) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updateContractSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const updated = await contractService.updateContract(id, parsed.data, user.id)
  return c.json({ data: updated })
})

// CRM management archive (soft-delete)
app.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const archived = await contractService.archiveContract(id, user.id)
  return c.json({ data: archived })
})

// CRM management restore (undo archive)
app.post('/:id/restore', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const restored = await contractService.restoreContract(id, user.id)
  return c.json({ data: restored })
})

app.get('/:id/pdf', async (c) => {
  const id = c.req.param('id')
  const contract = await contractService.getContractWithContact(id)
  if (!contract) return c.json({ error: 'Not found' }, 404)
  try {
    const { renderContractPdf } = await import('../../services/crm/pdf.service.js')
    const buffer = await renderContractPdf(contract)
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(contract.reference as string) || 'contrat'}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[crm] Contract PDF error:', err)
    return c.json({ error: 'PDF generation failed' }, 500)
  }
})

app.patch('/:id/sign', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const contract = await contractService.getContractById(id)
  if (!contract) return c.json({ error: 'Not found' }, 404)
  const updated = await contractService.markContractSigned(id, user.id)
  return c.json({ data: updated })
})

export default app
