import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { createReminderSchema, updateReminderSchema, crmReminderStatusEnum } from '../../schemas/crm/reminder.schema.js'
import * as reminderService from '../../services/crm/reminder.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const contactId = c.req.query('contact_id')
  const invoiceId = c.req.query('invoice_id')
  const status = c.req.query('status')
  const sort = c.req.query('sort') as 'created_at' | 'updated_at' | 'scheduled_at' | undefined
  const order = c.req.query('order') as 'asc' | 'desc' | undefined
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Number(c.req.query('offset')) || 0

  let statusFilter:
    | 'draft'
    | 'scheduled'
    | 'sent'
    | 'replied'
    | 'successful'
    | 'closed'
    | 'cancelled'
    | Array<
        'draft' | 'scheduled' | 'sent' | 'replied' | 'successful' | 'closed' | 'cancelled'
      >
    | undefined
  let legacyStatus: 'pending' | undefined

  if (status === 'pending') {
    legacyStatus = 'pending'
  } else if (status) {
    const parts = status.split(',').map((s) => s.trim())
    const parsed = parts.map((p) => crmReminderStatusEnum.safeParse(p)).filter((r) => r.success)
    if (parsed.length === 1) {
      statusFilter = parsed[0]!.data
    } else if (parsed.length > 1) {
      statusFilter = parsed.map((r) => r.data) as typeof statusFilter
    }
  }

  const { data, total, counts } = await reminderService.listReminders({
    contactId: contactId || undefined,
    invoiceId: invoiceId || undefined,
    status: statusFilter,
    legacyStatus,
    sort: sort || 'created_at',
    order: order || 'desc',
    limit,
    offset,
  })
  return c.json({ data, total, counts })
})

app.post('/', async (c) => {
  const user = c.get('user')
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = createReminderSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const reminder = await reminderService.createReminder(parsed.data, user.id)
  return c.json({ data: reminder }, 201)
})

app.patch('/:id', async (c) => {
  const id = c.req.param('id')
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updateReminderSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  try {
    const updated = await reminderService.updateReminder(id, parsed.data)
    return c.json({ data: updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    if (msg.includes('not found')) return c.json({ error: 'Not found' }, 404)
    throw e
  }
})

app.post('/:id/send', async (c) => {
  const id = c.req.param('id')
  const reminder = await reminderService.getReminderById(id)
  if (!reminder) return c.json({ error: 'Not found' }, 404)
  const updated = await reminderService.markReminderSent(id)
  // Fetch contact for email/whatsapp
  const { getContactById } = await import('../../services/crm/contact.service.js')
  const contact = await getContactById(reminder.contact_id as string)
  const channel = (reminder.channel as string) ?? 'both'
  void import('../../services/crm/notification.crm.service.js').then(({ notifyReminder }) =>
    notifyReminder({
      channel: channel as 'email' | 'whatsapp' | 'both',
      message: reminder.message as string,
      contactEmail: contact?.email as string,
      contactWhatsapp: (contact?.whatsapp as string) ?? (contact?.phone as string),
      subject: `Rappel : ${reminder.type}`,
    })
  ).catch((e) => console.error('[crm] Reminder send notification:', e))
  return c.json({ data: updated })
})

export default app
