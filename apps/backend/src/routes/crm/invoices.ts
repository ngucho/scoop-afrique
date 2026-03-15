import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { createInvoiceSchema, updateInvoiceSchema } from '../../schemas/crm/invoice.schema.js'
import { createPaymentSchema } from '../../schemas/crm/payment.schema.js'
import * as invoiceService from '../../services/crm/invoice.service.js'
import * as paymentService from '../../services/crm/payment.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const contactId = c.req.query('contact_id')
  const projectId = c.req.query('project_id')
  const status = c.req.query('status')
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Number(c.req.query('offset')) || 0

  const { data, total } = await invoiceService.listInvoices({
    contactId: contactId || undefined,
    projectId: projectId || undefined,
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
  const parsed = createInvoiceSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const invoice = await invoiceService.createInvoice(parsed.data, user.id)
  return c.json({ data: invoice }, 201)
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const invoice = await invoiceService.getInvoiceById(id)
  if (!invoice) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: invoice })
})

app.patch('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const invoice = await invoiceService.getInvoiceById(id)
  if (!invoice) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updateInvoiceSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const updated = await invoiceService.updateInvoice(id, parsed.data, user.id)
  return c.json({ data: updated })
})

app.post('/:id/send', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const invoice = await invoiceService.getInvoiceWithContact(id)
  if (!invoice) return c.json({ error: 'Not found' }, 404)
  const updated = await invoiceService.markInvoiceSent(id, user.id)
  const contact = invoice.crm_contacts as Record<string, unknown> | null
  void import('../../services/crm/notification.crm.service.js').then(({ notifyInvoiceSent }) =>
    notifyInvoiceSent({
      reference: invoice.reference as string,
      total: invoice.total as number,
      currency: (invoice.currency as string) ?? 'FCFA',
      dueDate: invoice.due_date as string,
      contactEmail: contact?.email as string,
      contactName: contact
        ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        : undefined,
      contactWhatsapp: contact?.whatsapp as string,
    })
  ).catch((e) => console.error('[crm] Invoice send notification:', e))
  return c.json({ data: updated })
})

app.get('/:id/pdf', async (c) => {
  const id = c.req.param('id')
  const invoice = await invoiceService.getInvoiceWithContact(id)
  if (!invoice) return c.json({ error: 'Not found' }, 404)
  try {
    const { renderInvoicePdf } = await import('../../services/crm/pdf.service.js')
    const buffer = await renderInvoicePdf(invoice)
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(invoice.reference as string) || 'facture'}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[crm] Invoice PDF error:', err)
    return c.json({ error: 'PDF generation failed' }, 500)
  }
})

app.post('/:id/payments', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const invoice = await invoiceService.getInvoiceById(id)
  if (!invoice) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = createPaymentSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const payment = await paymentService.createPayment(id, parsed.data, user.id)
  const invoiceWithContact = await invoiceService.getInvoiceWithContact(id)
  const contact = invoiceWithContact?.crm_contacts as Record<string, unknown> | null
  void import('../../services/crm/notification.crm.service.js').then(({ notifyPaymentReceived }) =>
    notifyPaymentReceived({
      amount: parsed.data.amount,
      currency: parsed.data.currency ?? 'FCFA',
      invoiceReference: invoiceWithContact?.reference as string,
      contactEmail: contact?.email as string,
      contactName: contact
        ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        : undefined,
    })
  ).catch((e) => console.error('[crm] Payment notification:', e))
  return c.json({ data: payment }, 201)
})

app.get('/:id/payments', async (c) => {
  const id = c.req.param('id')
  const invoice = await invoiceService.getInvoiceById(id)
  if (!invoice) return c.json({ error: 'Not found' }, 404)
  const payments = await paymentService.listPaymentsByInvoice(id)
  return c.json({ data: payments })
})

export default app
