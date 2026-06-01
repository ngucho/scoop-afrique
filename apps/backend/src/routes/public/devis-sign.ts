/**
 * Public devis signing route — no authentication required.
 * Accessible to anyone with the sign token link.
 */
import { Hono } from 'hono'
import * as devisService from '../../services/crm/devis.service.js'
import { getCompanyInfo, getPaymentMethods } from '../../services/crm/settings.service.js'

const app = new Hono()

/** GET /api/v1/public/devis-sign/:token — returns public devis data for client signing page */
app.get('/:token', async (c) => {
  const token = c.req.param('token')
  if (!token || token.length < 32) return c.json({ error: 'Token invalide' }, 400)

  const devis = await devisService.getDevisBySignToken(token)
  if (!devis) return c.json({ error: 'Devis introuvable ou lien expiré' }, 404)

  const [companyInfo, paymentMethods] = await Promise.all([
    getCompanyInfo(),
    getPaymentMethods(),
  ])

  // Expose only what the client needs — no internal notes
  const contact = devis.crm_contacts as Record<string, unknown> | null
  const project = devis.crm_projects as Record<string, unknown> | null

  return c.json({
    data: {
      id: devis.id,
      reference: devis.reference,
      title: devis.title,
      status: devis.status,
      signed_at: devis.signed_at,
      signature_data: devis.signature_data,
      valid_until: devis.valid_until,
      line_items: devis.line_items,
      subtotal: devis.subtotal,
      tax_rate: devis.tax_rate,
      tax_amount: devis.tax_amount,
      total: devis.total,
      currency: devis.currency,
      notes: devis.notes,
      contact: contact
        ? {
            first_name: contact.first_name,
            last_name: contact.last_name,
            company: contact.company,
          }
        : null,
      project: project
        ? {
            reference: project.reference,
            title: project.title,
          }
        : null,
      company: {
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        email: companyInfo.email,
        website: companyInfo.website,
        rccm: companyInfo.rccm,
      },
      payment_methods: paymentMethods.filter((m) => m.active),
    },
  })
})

/** POST /api/v1/public/devis-sign/:token — submit client signature */
app.post('/:token', async (c) => {
  const token = c.req.param('token')
  if (!token || token.length < 32) return c.json({ error: 'Token invalide' }, 400)

  let body: { signer_name?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'JSON invalide' }, 400)
  }

  const signerName = (body.signer_name || '').trim()
  if (!signerName || signerName.length < 2) {
    return c.json({ error: 'Veuillez saisir votre nom complet pour signer' }, 400)
  }
  if (signerName.length > 120) {
    return c.json({ error: 'Nom trop long' }, 400)
  }

  try {
    const updated = await devisService.signDevis(token, signerName)
    return c.json({
      data: {
        reference: updated.reference,
        status: updated.status,
        signed_at: updated.signed_at,
        signature_data: updated.signature_data,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur de signature'
    return c.json({ error: msg }, 400)
  }
})

export default app
