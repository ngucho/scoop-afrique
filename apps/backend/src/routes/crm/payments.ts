import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import * as paymentService from '../../services/crm/payment.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/:id/receipt/pdf', async (c) => {
  const id = c.req.param('id')
  const payment = await paymentService.getPaymentWithInvoice(id)
  if (!payment) return c.json({ error: 'Not found' }, 404)
  try {
    const { renderReceiptPdf } = await import('../../services/crm/pdf.service.js')
    const invoice = payment.crm_invoices as Record<string, unknown> | null
    const contact = invoice?.crm_contacts as Record<string, unknown> | null
    const buffer = await renderReceiptPdf(payment, invoice ?? undefined, contact ?? undefined)
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recu-${id}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[crm] Receipt PDF error:', err)
    return c.json({ error: 'PDF generation failed' }, 500)
  }
})

export default app
