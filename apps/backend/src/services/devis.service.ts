/**
 * Devis (quote request) service — stores requests and sends notifications.
 */
import { getDb } from '../db/index.js'
import { devisRequests } from '../db/schema.js'
import { config } from '../config/env.js'
import { logApiError } from '@scoop-afrique/api-logger'
import type { DevisBody } from '../schemas/devis.js'

const TEAM_EMAIL = 'contact@scoop-afrique.com'
const SITE_URL = 'https://www.scoop-afrique.com'

export interface DevisRecord {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  company: string | null
  service_slug: string | null
  budget_min: number | null
  budget_max: number | null
  budget_currency: string
  preferred_date: string | null
  deadline: string | null
  description: string
  source_url: string | null
  created_at: string
}

export async function createDevisRequest(body: DevisBody): Promise<{ id: string; success: boolean; message?: string }> {
  if (!config.database) {
    return { id: '', success: false, message: 'Service indisponible' }
  }

  const db = getDb()

  // Normalize preferred_date to YYYY-MM-DD (PostgreSQL DATE)
  let preferredDate: string | null = null
  if (body.preferred_date?.trim()) {
    const d = body.preferred_date.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) preferredDate = d
    else {
      const parsed = new Date(d)
      if (!Number.isNaN(parsed.getTime())) preferredDate = parsed.toISOString().slice(0, 10)
    }
  }

  let row: { id: string } | undefined
  try {
    ;[row] = await db
      .insert(devisRequests)
      .values({
        firstName: body.first_name.trim(),
        lastName: body.last_name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone?.trim() || null,
        company: body.company?.trim() || null,
        serviceSlug: body.service_slug?.trim() || null,
        budgetMin: body.budget_min ?? null,
        budgetMax: body.budget_max ?? null,
        budgetCurrency: body.budget_currency || 'FCFA',
        preferredDate,
        deadline: body.deadline?.trim() || null,
        description: body.description.trim(),
        sourceUrl: body.source_url || null,
      })
      .returning({ id: devisRequests.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[devis] Insert failed:', msg, err)
    return {
      id: '',
      success: false,
      message: msg.includes('permission') || msg.includes('policy')
        ? 'Configuration base de données. Vérifiez les migrations et RLS.'
        : 'Erreur lors de l\'enregistrement. Réessayez.',
    }
  }

  if (!row) {
    return { id: '', success: false, message: 'Failed to create devis request' }
  }

  const id = row.id

  // Send notifications (fire-and-forget; don't block response)
  void sendDevisNotifications({ ...body, id }).catch((err) => {
    logApiError({ msg: 'devis_notification_error', err, path: '/api/v1/devis' })
  })

  return { id, success: true }
}

async function sendDevisNotifications(payload: DevisBody & { id: string }): Promise<void> {
  const { id, first_name, last_name, email, phone, company, service_slug, budget_min, budget_max, description, deadline } = payload

  const budgetStr =
    budget_min != null || budget_max != null
      ? `${budget_min ?? '?'} – ${budget_max ?? '?'} ${payload.budget_currency}`
      : 'Non précisé'

  const summary = [
    `Nouvelle demande de devis #${id.slice(0, 8)}`,
    `Contact : ${first_name} ${last_name} <${email}>`,
    phone ? `Tél : ${phone}` : null,
    company ? `Entreprise : ${company}` : null,
    service_slug ? `Service : ${service_slug}` : null,
    `Budget : ${budgetStr}`,
    deadline ? `Délai : ${deadline}` : null,
    `Description : ${description.slice(0, 200)}${description.length > 200 ? '…' : ''}`,
  ]
    .filter(Boolean)
    .join('\n')

  // Email to team (Resend if configured)
  const fromEmail = config.resend?.fromEmail ?? 'Scoop Afrique <onboarding@resend.dev>'
  if (config.resend?.apiKey) {
    try {
      const res = (await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.resend.apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: TEAM_EMAIL,
          subject: `[Devis] ${first_name} ${last_name} – ${service_slug || 'Demande générale'}`,
          text: summary,
        }),
      })) as { ok: boolean; text: () => Promise<string> }
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Resend error: ${err}`)
      }
    } catch (err) {
      console.error('[devis] Resend error:', err)
    }
  }

  // Email to prospect (confirmation)
  if (config.resend?.apiKey) {
    try {
      const confirmBody = `Bonjour ${first_name},

Nous avons bien reçu votre demande de devis. Notre équipe vous répondra sous 24 à 48 heures ouvrées.

Récapitulatif :
${summary}

Pour toute question : ${TEAM_EMAIL}

— L'équipe Scoop Afrique
${SITE_URL}`
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.resend.apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: 'Demande de devis reçue — Scoop Afrique',
          text: confirmBody,
        }),
      })
    } catch (err) {
      logApiError({ msg: 'devis_prospect_email_error', err, path: '/api/v1/devis' })
    }
  }

  // WhatsApp notification to team (Twilio if configured)
  if (config.twilio?.whatsappTo && config.twilio?.accountSid && config.twilio?.authToken) {
    try {
      const msg = `🆕 Nouvelle demande de devis\n\n${first_name} ${last_name}\n${email}\n${service_slug || '—'}\n${budgetStr}\n\n${description.slice(0, 150)}…`
      const params = new URLSearchParams({
        To: `whatsapp:${config.twilio.whatsappTo}`,
        From: config.twilio.whatsappFrom,
        Body: msg,
      })
      const auth = Buffer.from(`${config.twilio.accountSid}:${config.twilio.authToken}`).toString('base64')
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        body: params.toString(),
      })
    } catch (err) {
      logApiError({ msg: 'devis_whatsapp_error', err, path: '/api/v1/devis' })
    }
  }

  // SMS notification to team (Twilio if configured)
  const tw = config.twilio as { accountSid?: string; authToken?: string; smsFrom?: string; smsTo?: string } | null
  if (tw?.accountSid && tw?.authToken && tw?.smsFrom && tw?.smsTo) {
    try {
      const smsMsg = `[SCOOP] Nouvelle demande de devis: ${first_name} ${last_name} - ${email}`
      const params = new URLSearchParams({
        To: tw.smsTo.replace(/^whatsapp:/i, ''),
        From: tw.smsFrom,
        Body: smsMsg,
      })
      const auth = Buffer.from(`${tw.accountSid}:${tw.authToken}`).toString('base64')
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${tw.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        body: params.toString(),
      })
    } catch (err) {
      logApiError({ msg: 'devis_sms_error', err, path: '/api/v1/devis' })
    }
  }
}
