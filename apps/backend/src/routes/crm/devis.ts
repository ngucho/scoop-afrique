import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { createDevisSchema, updateDevisSchema } from '../../schemas/crm/devis.schema.js'
import * as devisService from '../../services/crm/devis.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const contactId = c.req.query('contact_id')
  const status = c.req.query('status')
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Number(c.req.query('offset')) || 0

  const { data, total } = await devisService.listDevis({
    contactId: contactId || undefined,
    status: status || undefined,
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
  const parsed = createDevisSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const devis = await devisService.createDevis(parsed.data, user.id)
  return c.json({ data: devis }, 201)
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const devis = await devisService.getDevisWithContact(id)
  if (!devis) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: devis })
})

app.patch('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const devis = await devisService.getDevisById(id)
  if (!devis) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updateDevisSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const updated = await devisService.updateDevis(id, parsed.data, user.id)
  return c.json({ data: updated })
})

app.post('/:id/send', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const devis = await devisService.getDevisWithContact(id)
  if (!devis) return c.json({ error: 'Not found' }, 404)
  const updated = await devisService.markDevisSent(id, user.id)
  const contact = devis.crm_contacts as Record<string, unknown> | null
  void import('../../services/crm/notification.crm.service.js').then(({ notifyDevisSent }) =>
    notifyDevisSent({
      reference: devis.reference as string,
      total: devis.total as number,
      currency: (devis.currency as string) ?? 'FCFA',
      contactEmail: contact?.email as string,
      contactName: contact
        ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        : undefined,
      contactWhatsapp: contact?.whatsapp as string,
    })
  ).catch((e) => console.error('[crm] Devis send notification:', e))
  return c.json({ data: updated })
})

app.get('/:id/pdf', async (c) => {
  const id = c.req.param('id')
  const devis = await devisService.getDevisWithContact(id)
  if (!devis) return c.json({ error: 'Not found' }, 404)
  try {
    const { renderDevisPdf } = await import('../../services/crm/pdf.service.js')
    const buffer = await renderDevisPdf(devis)
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(devis.reference as string) || 'devis'}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[crm] Devis PDF error:', err)
    return c.json({ error: 'PDF generation failed' }, 500)
  }
})

app.post('/:id/convert', requireRole('manager', 'admin'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const devis = await devisService.getDevisWithContact(id)
  if (!devis) return c.json({ error: 'Not found' }, 404)
  await devisService.markDevisAccepted(id, user.id)
  const contact = devis.crm_contacts as Record<string, unknown> | null
  void import('../../services/crm/notification.crm.service.js').then(({ notifyDevisAccepted }) =>
    notifyDevisAccepted({
      reference: devis.reference as string,
      contactName: contact
        ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        : undefined,
    })
  ).catch((e) => console.error('[crm] Devis accepted notification:', e))
  const updated = await devisService.getDevisById(id)
  return c.json({ data: updated })
})

export default app
