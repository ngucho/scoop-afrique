/**
 * CRM notification service — email (Resend) + WhatsApp (Twilio)
 */
import { config } from '../../config/env.js'
import type { FetchResponse } from '../../lib/http.js'

const SITE_URL = 'https://www.scoop-afrique.com'

function getTeamEmails(): string[] {
  const emails = (config.resend as { notificationEmails?: string[] } | undefined)?.notificationEmails
  return emails?.length ? emails : ['contact@scoop-afrique.com']
}

function getFromEmail(): string {
  return config.resend?.fromEmail ?? 'Scoop Afrique <onboarding@resend.dev>'
}

async function sendEmail(params: {
  to: string | string[]
  subject: string
  text: string
  html?: string
  attachments?: Array<{ filename: string; content: Buffer }>
}): Promise<void> {
  if (!config.resend?.apiKey) return
  const to = Array.isArray(params.to) ? params.to : [params.to]
  const body: Record<string, unknown> = {
    from: getFromEmail(),
    to,
    subject: params.subject,
    text: params.text,
  }
  if (params.html) body.html = params.html
  if (params.attachments?.length) {
    body.attachments = params.attachments.map((a) => ({
      filename: a.filename,
      content: a.content.toString('base64'),
    }))
  }
  const res = (await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.resend.apiKey}`,
    },
    body: JSON.stringify(body),
  })) as FetchResponse
  if (!res.ok) throw new Error(`Resend: ${await res.text()}`)
}

async function sendWhatsApp(message: string): Promise<void> {
  if (!config.twilio?.whatsappTo || !config.twilio?.accountSid || !config.twilio?.authToken) return
  const params = new URLSearchParams({
    To: `whatsapp:${config.twilio.whatsappTo}`,
    From: config.twilio.whatsappFrom,
    Body: message,
  })
  const auth = Buffer.from(
    `${config.twilio.accountSid}:${config.twilio.authToken}`
  ).toString('base64')
  const res = (await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: params.toString(),
    }
  )) as FetchResponse
  if (!res.ok) throw new Error(`Twilio: ${await res.text()}`)
}

async function sendWhatsAppTo(to: string, message: string, mediaUrl?: string): Promise<void> {
  if (!config.twilio?.accountSid || !config.twilio?.authToken) return
  const from = config.twilio.whatsappFrom
  const params = new URLSearchParams({
    To: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    From: from,
    Body: message,
  })
  if (mediaUrl) params.set('MediaUrl', mediaUrl)
  const auth = Buffer.from(
    `${config.twilio.accountSid}:${config.twilio.authToken}`
  ).toString('base64')
  const res = (await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: params.toString(),
    }
  )) as FetchResponse
  if (!res.ok) throw new Error(`Twilio: ${await res.text()}`)
}

async function sendSms(to: string, message: string): Promise<void> {
  const tw = config.twilio as { accountSid: string; authToken: string; smsFrom?: string; smsTo?: string } | null
  if (!tw?.accountSid || !tw?.authToken || !tw?.smsFrom) return
  const params = new URLSearchParams({
    To: to.replace(/^whatsapp:/i, ''),
    From: tw.smsFrom,
    Body: message,
  })
  const auth = Buffer.from(`${tw.accountSid}:${tw.authToken}`).toString('base64')
  const res = (await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${tw.accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: params.toString(),
    }
  )) as FetchResponse
  if (!res.ok) throw new Error(`Twilio SMS: ${await res.text()}`)
}

export async function notifyDevisSent(params: {
  reference: string
  total: number
  currency: string
  contactEmail?: string
  contactName?: string
  contactWhatsapp?: string
  devisPdfBuffer?: Buffer
  devisPdfUrl?: string
}): Promise<void> {
  const { reference, total, currency, contactEmail, contactName, contactWhatsapp, devisPdfBuffer, devisPdfUrl } = params
  const totalStr = `${total.toLocaleString('fr-FR')} ${currency}`

  // Email to team
  await sendEmail({
    to: getTeamEmails(),
    subject: `[CRM] Devis ${reference} envoyé`,
    text: `Devis ${reference} (${totalStr}) envoyé à ${contactName || '—'}`,
    attachments: devisPdfBuffer ? [{ filename: `devis-${reference}.pdf`, content: devisPdfBuffer }] : undefined,
  }).catch((e) => console.error('[crm-notif] Devis sent team email:', e))

  // Email to client with PDF attachment
  if (contactEmail) {
    await sendEmail({
      to: contactEmail,
      subject: `Votre devis ${reference} — SCOOP`,
      text: `Bonjour ${contactName || ''},\n\nVotre devis ${reference} d'un montant de ${totalStr} vous est joint en pièce jointe.\n\nPour toute question : ${getTeamEmails()[0] ?? 'contact@scoop-afrique.com'}\n\n— L'équipe SCOOP`,
      attachments: devisPdfBuffer ? [{ filename: `devis-${reference}.pdf`, content: devisPdfBuffer }] : undefined,
    }).catch((e) => console.error('[crm-notif] Devis sent client email:', e))
  }

  // WhatsApp to client with PDF link
  if (contactWhatsapp) {
    const msg = devisPdfUrl
      ? `Bonjour ${contactName || ''},\n\nVotre devis ${reference} (${totalStr}) est prêt.\nTéléchargez-le ici : ${devisPdfUrl}\n\n— SCOOP`
      : `Bonjour ${contactName || ''},\n\nVotre devis ${reference} (${totalStr}) vous a été envoyé par email.\n\n— SCOOP`
    await sendWhatsAppTo(contactWhatsapp, msg).catch((e) =>
      console.error('[crm-notif] Devis sent client WhatsApp:', e)
    )
  }

  // WhatsApp to team
  await sendWhatsApp(
    `📤 Devis ${reference} envoyé\n${totalStr}\nClient: ${contactName || '—'}`
  ).catch((e) => console.error('[crm-notif] Devis sent team WhatsApp:', e))
}

export async function notifyDevisAccepted(params: {
  reference: string
  contactName?: string
}): Promise<void> {
  await sendEmail({
    to: getTeamEmails(),
    subject: `[CRM] Devis ${params.reference} accepté`,
    text: `Le devis ${params.reference} a été accepté par ${params.contactName || '—'}.`,
  }).catch((e) => console.error('[crm-notif] Devis accepted:', e))

  await sendWhatsApp(
    `✅ Devis ${params.reference} accepté par ${params.contactName || '—'}`
  ).catch((e) => console.error('[crm-notif] Devis accepted WhatsApp:', e))
}

export async function notifyInvoiceSent(params: {
  reference: string
  total: number
  currency: string
  dueDate?: string
  contactEmail?: string
  contactName?: string
  contactWhatsapp?: string
  invoicePdfBuffer?: Buffer
  invoicePdfUrl?: string
}): Promise<void> {
  const { reference, total, currency, dueDate, contactEmail, contactName, contactWhatsapp, invoicePdfBuffer, invoicePdfUrl } = params
  const totalStr = `${total.toLocaleString('fr-FR')} ${currency}`

  await sendEmail({
    to: getTeamEmails(),
    subject: `[CRM] Facture ${reference} envoyée`,
    text: `Facture ${reference} (${totalStr}) envoyée à ${contactName || '—'}`,
    attachments: invoicePdfBuffer ? [{ filename: `facture-${reference}.pdf`, content: invoicePdfBuffer }] : undefined,
  }).catch((e) => console.error('[crm-notif] Invoice sent team:', e))

  if (contactEmail) {
    await sendEmail({
      to: contactEmail,
      subject: `Facture ${reference} — SCOOP`,
      text: `Bonjour ${contactName || ''},\n\nVotre facture ${reference} d'un montant de ${totalStr}${dueDate ? `, à régler avant le ${dueDate}` : ''}.\n\nLe document est joint en pièce jointe.\n\nPour toute question : ${getTeamEmails()[0] ?? 'contact@scoop-afrique.com'}\n\n— L'équipe SCOOP`,
      attachments: invoicePdfBuffer ? [{ filename: `facture-${reference}.pdf`, content: invoicePdfBuffer }] : undefined,
    }).catch((e) => console.error('[crm-notif] Invoice sent client:', e))
  }

  await sendWhatsApp(
    `📄 Facture ${reference} envoyée\n${totalStr}\nClient: ${contactName || '—'}`
  ).catch((e) => console.error('[crm-notif] Invoice sent team WhatsApp:', e))

  if (contactWhatsapp) {
    const msg = invoicePdfUrl
      ? `Bonjour ${contactName || ''},\n\nVotre facture ${reference} (${totalStr})${dueDate ? `, à régler avant le ${dueDate}` : ''}.\nTéléchargez-la ici : ${invoicePdfUrl}\n\n— SCOOP`
      : `Facture ${reference} : ${totalStr} à régler${dueDate ? ` avant le ${dueDate}` : ''}.\n\n— SCOOP`
    await sendWhatsAppTo(contactWhatsapp, msg).catch((e) =>
      console.error('[crm-notif] Invoice sent client WhatsApp:', e)
    )
  }
}

export async function notifyPaymentReceived(params: {
  amount: number
  currency: string
  invoiceReference: string
  contactEmail?: string
  contactName?: string
  receiptPdfBuffer?: Buffer
}): Promise<void> {
  const { amount, currency, invoiceReference, contactEmail, contactName, receiptPdfBuffer } = params
  const amountStr = `${amount.toLocaleString('fr-FR')} ${currency}`

  await sendWhatsApp(
    `💰 Paiement reçu\n${amountStr}\nFacture ${invoiceReference}\nClient: ${contactName || '—'}`
  ).catch((e) => console.error('[crm-notif] Payment WhatsApp:', e))

  if (contactEmail && receiptPdfBuffer) {
    await sendEmail({
      to: contactEmail,
      subject: `Reçu de paiement — ${invoiceReference}`,
      text: `Bonjour ${contactName || ''},\n\nNous avons bien reçu votre paiement de ${amountStr} (facture ${invoiceReference}). Le reçu est en pièce jointe.\n\n— L'équipe Scoop Afrique`,
      attachments: [{ filename: `recu-${invoiceReference}.pdf`, content: receiptPdfBuffer }],
    }).catch((e) => console.error('[crm-notif] Payment receipt email:', e))
  }
}

export async function notifyInvoiceOverdue(params: {
  reference: string
  amountDue: number
  currency: string
  contactEmail?: string
  contactWhatsapp?: string
}): Promise<void> {
  const { reference, amountDue, currency, contactEmail, contactWhatsapp } = params
  const amountStr = `${amountDue.toLocaleString('fr-FR')} ${currency}`

  if (contactEmail) {
    await sendEmail({
      to: contactEmail,
      subject: `Rappel : facture ${reference} en retard`,
      text: `Bonjour,\n\nVotre facture ${reference} (solde dû : ${amountStr}) est en retard de paiement.\n\nMerci de régulariser votre situation.\n\n— L'équipe Scoop Afrique`,
    }).catch((e) => console.error('[crm-notif] Invoice overdue email:', e))
  }

  await sendWhatsApp(
    `⚠️ Facture ${reference} en retard\nSolde dû : ${amountStr}`
  ).catch((e) => console.error('[crm-notif] Invoice overdue WhatsApp:', e))
}

export async function notifyProjectDelivered(params: {
  reference: string
  title: string
  contactEmail?: string
  contactName?: string
}): Promise<void> {
  const { reference, title, contactEmail, contactName } = params

  if (contactEmail) {
    await sendEmail({
      to: contactEmail,
      subject: `Projet ${reference} livré — Scoop Afrique`,
      text: `Bonjour ${contactName || ''},\n\nVotre projet "${title}" (${reference}) a été livré.\n\nMerci pour votre confiance.\n\n— L'équipe Scoop Afrique`,
    }).catch((e) => console.error('[crm-notif] Project delivered:', e))
  }

  await sendWhatsApp(
    `📦 Projet ${reference} livré\n"${title}"\nClient: ${contactName || '—'}`
  ).catch((e) => console.error('[crm-notif] Project delivered WhatsApp:', e))
}

export async function notifyContractToSign(params: {
  reference: string
  title: string
  contactEmail?: string
  contactName?: string
}): Promise<void> {
  const { reference, title, contactEmail, contactName } = params

  if (contactEmail) {
    await sendEmail({
      to: contactEmail,
      subject: `Contrat à signer : ${title} — Scoop Afrique`,
      text: `Bonjour ${contactName || ''},\n\nLe contrat ${reference} "${title}" est prêt à être signé.\n\nMerci de nous le retourner signé.\n\n— L'équipe Scoop Afrique`,
    }).catch((e) => console.error('[crm-notif] Contract to sign:', e))
  }

  await sendWhatsApp(
    `📝 Contrat ${reference} à signer\n"${title}"\nClient: ${contactName || '—'}`
  ).catch((e) => console.error('[crm-notif] Contract to sign WhatsApp:', e))
}

export async function notifyReminder(params: {
  channel: 'email' | 'whatsapp' | 'both'
  message: string
  contactEmail?: string
  contactWhatsapp?: string
  subject?: string
}): Promise<void> {
  const { channel, message, contactEmail, contactWhatsapp, subject } = params

  if ((channel === 'email' || channel === 'both') && contactEmail) {
    await sendEmail({
      to: contactEmail,
      subject: subject ?? 'Rappel — Scoop Afrique',
      text: message,
    }).catch((e) => console.error('[crm-notif] Reminder email:', e))
  }

  if ((channel === 'whatsapp' || channel === 'both') && contactWhatsapp) {
    await sendWhatsAppTo(contactWhatsapp, message).catch((e) =>
      console.error('[crm-notif] Reminder WhatsApp:', e)
    )
  }

  if (channel === 'whatsapp' || channel === 'both') {
    await sendWhatsApp(`📌 Relance envoyée\n${message.slice(0, 100)}…`).catch((e) =>
      console.error('[crm-notif] Reminder team WhatsApp:', e)
    )
  }
}
