/**
 * WhatsApp wa.me utilities — generate direct links for individual client outreach.
 * No Twilio required; uses the wa.me web redirect service.
 */

/** Normalize a phone number to international format for wa.me */
export function normalizePhoneForWa(phone: string): string {
  // Remove spaces, dashes, parentheses
  let clean = phone.replace(/[\s\-().]/g, '')
  // Replace leading 00 with +
  if (clean.startsWith('00')) clean = '+' + clean.slice(2)
  // Strip leading +
  clean = clean.replace(/^\+/, '')
  return clean
}

/**
 * Build a wa.me link that opens WhatsApp with a pre-filled message.
 * @param phone - Phone number in any format (e.g. "+225 07 69 96 68 00")
 * @param message - Pre-filled message text (will be URL-encoded)
 */
export function buildWaLink(phone: string, message?: string): string {
  const number = normalizePhoneForWa(phone)
  if (!number) return '#'
  const base = `https://wa.me/${number}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

/** Build a WhatsApp link for a contact with optional pre-filled message */
export function buildContactWaLink(
  contact: { whatsapp?: string | null; phone?: string | null; first_name?: string | null; last_name?: string | null },
  message?: string,
): string | null {
  const phone = contact.whatsapp ?? contact.phone
  if (!phone) return null
  return buildWaLink(phone, message)
}

/** Build a pre-filled reminder message for WhatsApp */
export function buildReminderWaMessage(params: {
  firstName: string
  type: 'devis_follow_up' | 'invoice_overdue' | 'invoice_follow_up' | 'project_update' | 'custom'
  reference?: string
  amount?: number
  currency?: string
  paymentMethodsText?: string
}): string {
  const { firstName, type, reference, amount, paymentMethodsText } = params
  const currency = params.currency ?? 'FCFA'
  const amountStr = amount ? `${amount.toLocaleString('fr-FR')} ${currency}` : undefined
  const prenom = firstName?.trim() || 'Bonjour'

  let msg: string

  switch (type) {
    case 'invoice_overdue':
      msg = `Bonjour ${prenom},\n\nSauf erreur de notre part, la facture ${reference ?? ''}${amountStr ? ` (${amountStr})` : ''} n'est pas encore réglée. Pouvez-vous nous confirmer la date de paiement ? Merci pour votre retour.\n\n— Scoop Afrique`
      break
    case 'invoice_follow_up':
      msg = `Bonjour ${prenom},\n\nRappel concernant la facture ${reference ?? ''}${amountStr ? ` — ${amountStr}` : ''}. Besoin d'un délai ou d'une précision ? Répondez sur ce fil.\n\n— Scoop Afrique`
      break
    case 'devis_follow_up':
      msg = `Bonjour ${prenom},\n\nNous revenons vers vous concernant notre proposition commerciale${reference ? ` (${reference})` : ''}. Avez-vous pu en prendre connaissance ? Nous restons disponibles pour en discuter.\n\n— Scoop Afrique`
      break
    case 'project_update':
      msg = `Bonjour ${prenom},\n\nNous souhaiterions faire un point rapide sur l'avancement de votre projet. Avez-vous un créneau cette semaine ?\n\n— Scoop Afrique`
      break
    default:
      msg = `Bonjour ${prenom},\n\nNous revenons vers vous pour faire le point. Répondez sur ce fil si besoin.\n\n— Scoop Afrique`
  }

  if (paymentMethodsText) {
    msg += paymentMethodsText
  }

  return msg
}

/** Build a WhatsApp link for sending a document (invoice/devis) with PDF URL */
export function buildDocumentWaMessage(params: {
  firstName: string
  docType: 'facture' | 'devis' | 'recu' | 'contrat'
  reference: string
  amount?: number
  currency?: string
  pdfUrl?: string
  dueDate?: string
  paymentMethodsText?: string
}): string {
  const { firstName, docType, reference, pdfUrl, dueDate } = params
  const currency = params.currency ?? 'FCFA'
  const amountStr = params.amount ? `${params.amount.toLocaleString('fr-FR')} ${currency}` : undefined
  const labels: Record<string, string> = {
    facture: 'Facture',
    devis: 'Devis',
    recu: 'Reçu de paiement',
    contrat: 'Contrat',
  }
  const label = labels[docType] ?? docType

  let msg = `Bonjour ${firstName?.trim() || ''},\n\n`
  msg += `${label} ${reference}`
  if (amountStr) msg += ` — ${amountStr}`
  if (dueDate) msg += ` — à régler avant le ${dueDate}`
  msg += '.'

  if (pdfUrl) {
    msg += `\n\nConsultez le document ici :\n${pdfUrl}`
  }

  if (params.paymentMethodsText) {
    msg += params.paymentMethodsText
  }

  msg += '\n\n— Scoop Afrique'
  return msg
}
