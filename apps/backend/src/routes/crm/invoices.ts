import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { createInvoiceSchema, updateInvoiceSchema } from '../../schemas/crm/invoice.schema.js'
import { createPaymentSchema, updatePaymentSchema } from '../../schemas/crm/payment.schema.js'
import * as invoiceService from '../../services/crm/invoice.service.js'
import * as paymentService from '../../services/crm/payment.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const user = c.get('user')
  const contactId = c.req.query('contact_id')
  const projectId = c.req.query('project_id')
  const status = c.req.query('status')
  const archivedQuery = c.req.query('archived')
  const archived =
    archivedQuery === 'true'
      ? user.role === 'admin'
        ? true
        : undefined
      : archivedQuery === 'false'
        ? false
        : undefined
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Number(c.req.query('offset')) || 0

  const { data, total } = await invoiceService.listInvoices({
    contactId: contactId || undefined,
    projectId: projectId || undefined,
    status: status || undefined,
    archived,
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
  const user = c.get('user')
  const id = c.req.param('id')
  const invoice = await invoiceService.getInvoiceWithContactAndProject(id)
  if (!invoice) return c.json({ error: 'Not found' }, 404)
  if (Boolean((invoice as Record<string, unknown>)['is_archived']) && user.role !== 'admin')
    return c.json({ error: 'Not found' }, 404)
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

  const amountPaid = Number((invoice as Record<string, unknown>).amount_paid ?? 0)
  const invStatus = String((invoice as Record<string, unknown>).status ?? '')
  const hasPayment = amountPaid > 0 || invStatus === 'paid' || invStatus === 'partial'
  const privileged = user.role === 'manager' || user.role === 'admin'

  let payload = parsed.data
  if (hasPayment && !privileged) {
    const {
      line_items: _l,
      tax_rate: _t,
      discount_amount: _d,
      currency: _c,
      ...rest
    } = payload
    payload = rest
    const triedFinancial =
      parsed.data.line_items !== undefined ||
      parsed.data.tax_rate !== undefined ||
      parsed.data.discount_amount !== undefined ||
      parsed.data.currency !== undefined
    if (triedFinancial) {
      return c.json(
        {
          error:
            'Modification des montants/lignes interdite : paiements enregistrés. Demandez un manager ou un admin.',
        },
        403
      )
    }
  }

  const updated = await invoiceService.updateInvoice(id, payload, user.id)
  return c.json({ data: updated })
})

// Admin archive (soft-delete)
app.delete('/:id', requireRole('admin'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const archived = await invoiceService.archiveInvoice(id, user.id)
  return c.json({ data: archived })
})

// Admin restore (undo archive)
app.post('/:id/restore', requireRole('admin'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const restored = await invoiceService.restoreInvoice(id, user.id)
  return c.json({ data: restored })
})

app.post('/:id/send', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const invoice = await invoiceService.getInvoiceWithContactAndProject(id)
  if (!invoice) return c.json({ error: 'Not found' }, 404)
  const updated = await invoiceService.markInvoiceSent(id, user.id)
  const contact = invoice.crm_contacts as Record<string, unknown> | null
  void (async () => {
    try {
      const { notifyInvoiceSent } = await import('../../services/crm/notification.crm.service.js')
      const { renderInvoicePdf, uploadPdfToStorage } = await import('../../services/crm/pdf.service.js')
      const buffer = await renderInvoicePdf(invoice)
      const ref = (invoice.reference as string) || id
      const pdfUrl = await uploadPdfToStorage(buffer, `invoices/${ref}.pdf`)
      await notifyInvoiceSent({
        reference: invoice.reference as string,
        total: invoice.total as number,
        currency: (invoice.currency as string) ?? 'FCFA',
        dueDate: invoice.due_date as string,
        contactEmail: contact?.email as string,
        contactName: contact
          ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
          : undefined,
        contactWhatsapp: (contact?.whatsapp as string) || (contact?.phone as string),
        invoicePdfBuffer: buffer,
        invoicePdfUrl: pdfUrl ?? undefined,
      })
    } catch (e) {
      console.error('[crm] Invoice send notification:', e)
    }
  })()
  return c.json({ data: updated })
})

app.get('/:id/pdf', async (c) => {
  const id = c.req.param('id')
  const invoice = await invoiceService.getInvoiceWithContactAndProject(id)
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

app.patch('/:id/payments/:paymentId', async (c) => {
  const user = c.get('user')
  const invoiceId = c.req.param('id')
  const paymentId = c.req.param('paymentId')
  const invoice = await invoiceService.getInvoiceById(invoiceId)
  if (!invoice) return c.json({ error: 'Not found' }, 404)
  const payment = await paymentService.getPaymentById(paymentId)
  if (!payment || String(payment.invoice_id) !== invoiceId) {
    return c.json({ error: 'Not found' }, 404)
  }
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updatePaymentSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  try {
    const data = await paymentService.updatePayment(paymentId, parsed.data, user.id)
    return c.json({ data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'Not found') return c.json({ error: 'Not found' }, 404)
    throw e
  }
})

export default app
