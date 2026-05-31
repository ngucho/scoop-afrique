/**
 * Modèles de relances — préremplissage selon le type et le canal (WhatsApp privilégié).
 * Placeholders : {{prenom}}, {{reference}}, {{montant}}, {{echeance}}, {{entreprise}}
 */

export type ReminderChannel = 'email' | 'whatsapp' | 'both'
export type ReminderTypeKey =
  | 'devis_follow_up'
  | 'invoice_overdue'
  | 'invoice_follow_up'
  | 'project_update'
  | 'custom'

export interface PaymentMethodBlock {
  id: string
  label: string
  number?: string
  iban?: string
  instructions?: string
  active: boolean
}

export function buildPaymentMethodsBlock(methods: PaymentMethodBlock[]): string {
  const active = methods.filter((m) => m.active)
  if (!active.length) return ''
  const lines = active.map((m) => {
    const parts = [`💳 *${m.label}*`]
    if (m.number) parts.push(m.number)
    if (m.iban) parts.push(m.iban)
    if (m.instructions) parts.push(`_(${m.instructions})_`)
    return parts.join(' — ')
  })
  return `\n\n*Moyens de paiement acceptés :*\n${lines.join('\n')}`
}

export function interpolateTemplate(
  template: string,
  vars: { prenom: string; reference?: string; montant?: string; echeance?: string; entreprise?: string },
): string {
  let s = template
  s = s.replace(/\{\{prenom\}\}/g, vars.prenom.trim() || 'Bonjour')
  s = s.replace(/\{\{reference\}\}/g, vars.reference?.trim() ?? '—')
  s = s.replace(/\{\{montant\}\}/g, vars.montant?.trim() ?? '—')
  s = s.replace(/\{\{echeance\}\}/g, vars.echeance?.trim() ?? '—')
  s = s.replace(/\{\{entreprise\}\}/g, vars.entreprise?.trim() ?? 'Scoop Afrique')
  return s
}

function formatMontant(m?: number): string | undefined {
  if (m == null || !Number.isFinite(m)) return undefined
  return `${Math.round(m).toLocaleString('fr-FR')} FCFA`
}

function varsFor(prenom: string, ctx?: { reference?: string; montantFcfa?: number }) {
  return {
    prenom: prenom || '',
    reference: ctx?.reference,
    montant: formatMontant(ctx?.montantFcfa),
  }
}

export function buildReminderTemplate(
  type: ReminderTypeKey,
  channel: ReminderChannel,
  prenom: string,
  ctx?: { reference?: string; montantFcfa?: number },
): string {
  const isEmail = channel === 'email'
  const v = varsFor(prenom, ctx)

  let raw: string
  switch (type) {
    case 'devis_follow_up':
      raw = isEmail
        ? `Bonjour {{prenom}},

Nous nous permettons de vous relancer concernant notre proposition${ctx?.reference ? ` (${ctx.reference})` : ''}.

Nous restons à votre disposition pour tout complément d'information.

Cordialement,
L'équipe Scoop Afrique`
        : `Bonjour {{prenom}},

Nous revenons vers vous concernant notre proposition commerciale${ctx?.reference ? ` (${ctx.reference})` : ''}. Avez-vous pu en prendre connaissance ? Nous restons disponibles sur WhatsApp pour en discuter.

Cordialement,
L'équipe Scoop Afrique`
      break
    case 'invoice_overdue':
      raw = isEmail
        ? `Bonjour {{prenom}},

Nous vous informons que la facture {{reference}} pour un montant de {{montant}} apparaît encore en attente de règlement.

Merci de nous confirmer le paiement ou de nous indiquer les modalités envisagées.

Cordialement`
        : `Bonjour {{prenom}},

Sauf erreur de notre part, la facture {{reference}} ({{montant}}) n'est pas encore réglée. Pouvez-vous nous confirmer le règlement ou une date prévue ? Merci pour votre retour ici.

Cordialement`
      break
    case 'invoice_follow_up':
      raw = isEmail
        ? `Bonjour {{prenom}},

Nous vous contactons concernant la facture {{reference}} ({{montant}}).

N'hésitez pas à nous répondre pour toute question.

Cordialement`
        : `Bonjour {{prenom}},

Rappel : facture {{reference}} — {{montant}}. Besoin d'un délai ou d'une précision ? Répondez sur ce fil.

Merci`
      break
    case 'project_update':
      raw = isEmail
        ? `Bonjour {{prenom}},

Nous souhaiterions faire un point avec vous sur l'avancement de votre projet.

Cordialement`
        : `Bonjour {{prenom}},

Point rapide sur votre projet : avez-vous un créneau cette semaine pour en parler ici ?

Cordialement`
      break
    case 'custom':
    default:
      raw = isEmail
        ? `Bonjour {{prenom}},

Nous revenons vers vous pour un point d'étape.

Cordialement`
        : `Bonjour {{prenom}},

Nous revenons vers vous pour faire un point. Répondez sur ce fil si besoin.

Cordialement`
  }

  return interpolateTemplate(raw, {
    prenom: v.prenom,
    reference: v.reference,
    montant: v.montant,
  })
}
