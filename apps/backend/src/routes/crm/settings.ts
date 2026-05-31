/**
 * CRM Settings routes
 * GET    /settings              — all settings
 * PUT    /settings/payment-methods — update payment methods
 * PUT    /settings/company-info — update company info
 * PUT    /settings/reminder-preferences — update reminder preferences
 * GET    /settings/reminder-rules — list auto-reminder rules
 * POST   /settings/reminder-rules — create rule
 * PATCH  /settings/reminder-rules/:id — update rule
 * DELETE /settings/reminder-rules/:id — delete rule
 */
import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import * as settingsService from '../../services/crm/settings.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

/* ── All settings ── */
app.get('/', async (c) => {
  const settings = await settingsService.getAllSettings()
  return c.json({ data: settings })
})

/* ── Payment methods ── */
app.put('/payment-methods', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null)
  if (!Array.isArray(body?.methods)) {
    return c.json({ error: 'body.methods must be an array' }, 400)
  }
  await settingsService.setPaymentMethods(body.methods, user.id)
  const updated = await settingsService.getPaymentMethods()
  return c.json({ data: updated })
})

/* ── Company info ── */
app.put('/company-info', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null)
  if (!body?.name) return c.json({ error: 'name is required' }, 400)
  await settingsService.setCompanyInfo(body, user.id)
  const updated = await settingsService.getCompanyInfo()
  return c.json({ data: updated })
})

/* ── Reminder preferences ── */
app.put('/reminder-preferences', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid body' }, 400)
  await settingsService.setReminderPreferences(body, user.id)
  const updated = await settingsService.getReminderPreferences()
  return c.json({ data: updated })
})

/* ── Reminder Rules ── */
app.get('/reminder-rules', async (c) => {
  const rules = await settingsService.listReminderRules()
  return c.json({ data: rules })
})

app.post('/reminder-rules', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null)
  if (!body?.name || !body?.trigger_event || !body?.message_template) {
    return c.json({ error: 'name, trigger_event, message_template required' }, 400)
  }
  const rule = await settingsService.createReminderRule({
    name: body.name,
    trigger_event: body.trigger_event,
    delay_days: Number(body.delay_days ?? 3),
    channel: body.channel ?? 'whatsapp',
    message_template: body.message_template,
    is_active: body.is_active ?? true,
    sort_order: Number(body.sort_order ?? 0),
  }, user.id)
  return c.json({ data: rule }, 201)
})

app.patch('/reminder-rules/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid body' }, 400)
  const updated = await settingsService.updateReminderRule(id, body)
  if (!updated) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: updated })
})

app.delete('/reminder-rules/:id', async (c) => {
  const id = c.req.param('id')
  const ok = await settingsService.deleteReminderRule(id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

export default app
