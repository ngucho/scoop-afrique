import { eq } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { newsletterSubscribers } from '../db/schema.js'
import { config } from '../config/env.js'
import { logger } from '../lib/logger.js'

function siteBase(): string {
  return config.publicSiteUrl?.replace(/\/+$/, '') ?? 'https://www.scoop-afrique.com'
}

async function sendNewsletterConfirmationEmail(toEmail: string, token: string): Promise<{ ok: boolean; error?: string }> {
  if (!config.resend?.apiKey) {
    logger.error('newsletter_confirm_email_skipped', new Error('RESEND_API_KEY not configured'))
    return { ok: false, error: 'Resend not configured' }
  }
  const from = config.resend.fromEmail
  if (!from) {
    logger.error('newsletter_confirm_email_skipped', new Error('RESEND_FROM_EMAIL not set'))
    return { ok: false, error: 'RESEND_FROM_EMAIL not set' }
  }

  const confirmUrl = `${siteBase()}/newsletter/confirm?token=${encodeURIComponent(token)}`
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Bonjour,</p>
  <p>Merci de votre intérêt pour <strong>Scoop.Afrique</strong>. Pour confirmer votre inscription à la newsletter, cliquez sur le lien ci-dessous :</p>
  <p><a href="${confirmUrl}" style="color: #0d6efd;">Confirmer mon adresse e-mail</a></p>
  <p style="font-size: 14px; color: #555;">Si le lien ne fonctionne pas, copiez-collez cette adresse dans votre navigateur :<br/><span style="word-break: break-all;">${confirmUrl}</span></p>
  <p style="font-size: 14px; color: #555;">Si vous n’avez pas demandé cette inscription, ignorez ce message.</p>
</body>
</html>`

  const res = (await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [toEmail.toLowerCase()],
      subject: 'Scoop.Afrique — Confirmez votre inscription à la newsletter',
      html,
    }),
  })) as { ok: boolean; status: number; json: () => Promise<{ message?: string }> }

  const body = (await res.json().catch(() => ({}))) as { message?: string }
  if (!res.ok) {
    const msg = body.message ?? `Resend HTTP ${res.status}`
    logger.error('newsletter_confirm_email_failed', new Error(msg))
    return { ok: false, error: msg }
  }
  return { ok: true }
}

export async function subscribe(
  email: string,
): Promise<{ success: boolean; message?: string; confirmation_email_sent?: boolean }> {
  if (!config.database) return { success: false, message: 'Service unavailable' }
  const db = getDb()
  const token = crypto.randomUUID()
  try {
    await db
      .insert(newsletterSubscribers)
      .values({
        email: email.toLowerCase(),
        status: 'pending',
        token,
      })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: { status: 'pending', token },
      })
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e.code === '23505') return { success: true, message: 'Déjà inscrit.' }
    return { success: false, message: (e as Error).message }
  }

  const send = await sendNewsletterConfirmationEmail(email, token)
  if (!send.ok) {
    return {
      success: true,
      confirmation_email_sent: false,
      message:
        'Inscription enregistrée. L’e-mail de confirmation n’a pas pu être envoyé (configuration e-mail). Notre équipe a été notifiée.',
    }
  }

  return {
    success: true,
    confirmation_email_sent: true,
    message: 'Inscription enregistrée. Vérifiez votre boîte mail pour confirmer.',
  }
}

export async function confirmSubscription(token: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [row] = await db
    .update(newsletterSubscribers)
    .set({ status: 'confirmed', confirmedAt: new Date(), token: null })
    .where(eq(newsletterSubscribers.token, token))
    .returning({ id: newsletterSubscribers.id })
  return !!row
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [row] = await db
    .update(newsletterSubscribers)
    .set({ status: 'unsubscribed' })
    .where(eq(newsletterSubscribers.token, token))
    .returning({ id: newsletterSubscribers.id })
  return !!row
}

export async function unsubscribeByEmail(email: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [row] = await db
    .update(newsletterSubscribers)
    .set({ status: 'unsubscribed' })
    .where(eq(newsletterSubscribers.email, email.toLowerCase()))
    .returning({ id: newsletterSubscribers.id })
  return !!row
}
