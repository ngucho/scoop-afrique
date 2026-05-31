/**
 * CRM Settings service — key-value store for payment methods, company info, reminder preferences.
 */
import { eq } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmSettings, crmReminderRules } from '../../db/schema.js'

/* ── Default values ── */

export interface PaymentMethod {
  id: string
  label: string
  number?: string
  iban?: string
  instructions?: string
  active: boolean
  sort: number
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'wave', label: 'Wave', number: '+225 0769966800', instructions: 'Envoyez sur ce numéro Wave et partagez la capture', active: true, sort: 1 },
  { id: 'orange_money', label: 'Orange Money', number: '+225 0769966800', instructions: 'Envoyez sur ce numéro Orange Money et partagez la capture', active: true, sort: 2 },
  { id: 'mtn_money', label: 'MTN MoMo', number: '', instructions: '', active: false, sort: 3 },
  { id: 'virement', label: 'Virement bancaire', iban: '', instructions: 'Virement SGBCI — RIB disponible sur demande', active: false, sort: 4 },
  { id: 'cash', label: 'Espèces', instructions: 'Paiement en agence', active: false, sort: 5 },
]

export interface CompanyInfo {
  name: string
  address: string
  email: string
  phone: string
  website: string
  siret?: string
  rccm?: string
}

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'Scoop Afrique',
  address: "Abidjan, Cocody Riviera Faya, Côte d'Ivoire",
  email: 'Contact@scoop-afrique.com',
  phone: '+225 0769966800',
  website: 'https://www.scoop-afrique.com',
}

export interface ReminderPreferences {
  default_channel: 'email' | 'whatsapp' | 'both'
  include_payment_methods_in_reminders: boolean
  auto_send_enabled: boolean
  send_hour: number
}

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  default_channel: 'whatsapp',
  include_payment_methods_in_reminders: true,
  auto_send_enabled: false,
  send_hour: 9,
}

/* ── Generic get/set ── */

async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = getDb()
    const [row] = await db.select().from(crmSettings).where(eq(crmSettings.key, key)).limit(1)
    if (!row) return defaultValue
    return row.value as T
  } catch {
    return defaultValue
  }
}

async function setSetting(key: string, value: unknown, updatedBy?: string): Promise<void> {
  const db = getDb()
  await db
    .insert(crmSettings)
    .values({ key, value: value as never, updatedBy: updatedBy ?? null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: crmSettings.key,
      set: { value: value as never, updatedBy: updatedBy ?? null, updatedAt: new Date() },
    })
}

/* ── Typed accessors ── */

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const methods = await getSetting<PaymentMethod[]>('payment_methods', DEFAULT_PAYMENT_METHODS)
  return methods.sort((a, b) => a.sort - b.sort)
}

export async function setPaymentMethods(methods: PaymentMethod[], updatedBy?: string): Promise<void> {
  await setSetting('payment_methods', methods, updatedBy)
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  return getSetting<CompanyInfo>('company_info', DEFAULT_COMPANY_INFO)
}

export async function setCompanyInfo(info: CompanyInfo, updatedBy?: string): Promise<void> {
  await setSetting('company_info', info, updatedBy)
}

export async function getReminderPreferences(): Promise<ReminderPreferences> {
  return getSetting<ReminderPreferences>('reminder_preferences', DEFAULT_REMINDER_PREFERENCES)
}

export async function setReminderPreferences(prefs: ReminderPreferences, updatedBy?: string): Promise<void> {
  await setSetting('reminder_preferences', prefs, updatedBy)
}

export async function getAllSettings() {
  const [paymentMethods, companyInfo, reminderPrefs] = await Promise.all([
    getPaymentMethods(),
    getCompanyInfo(),
    getReminderPreferences(),
  ])
  return { payment_methods: paymentMethods, company_info: companyInfo, reminder_preferences: reminderPrefs }
}

/* ── Reminder Rules ── */

export interface ReminderRule {
  id: string
  name: string
  trigger_event: string
  delay_days: number
  channel: string
  message_template: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export async function listReminderRules(): Promise<ReminderRule[]> {
  const db = getDb()
  const rows = await db.select().from(crmReminderRules).orderBy(crmReminderRules.sortOrder)
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    trigger_event: r.triggerEvent,
    delay_days: r.delayDays,
    channel: r.channel,
    message_template: r.messageTemplate,
    is_active: r.isActive,
    sort_order: r.sortOrder,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }))
}

export async function createReminderRule(
  data: Omit<ReminderRule, 'id' | 'created_at' | 'updated_at'>,
  createdBy?: string,
): Promise<ReminderRule> {
  const db = getDb()
  const [row] = await db
    .insert(crmReminderRules)
    .values({
      name: data.name,
      triggerEvent: data.trigger_event,
      delayDays: data.delay_days,
      channel: data.channel as 'email' | 'whatsapp' | 'both',
      messageTemplate: data.message_template,
      isActive: data.is_active,
      sortOrder: data.sort_order,
      createdBy: createdBy ?? null,
    })
    .returning()
  if (!row) throw new Error('Failed to create reminder rule')
  return {
    id: row.id,
    name: row.name,
    trigger_event: row.triggerEvent,
    delay_days: row.delayDays,
    channel: row.channel,
    message_template: row.messageTemplate,
    is_active: row.isActive,
    sort_order: row.sortOrder,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

export async function updateReminderRule(
  id: string,
  data: Partial<Omit<ReminderRule, 'id' | 'created_at' | 'updated_at'>>,
): Promise<ReminderRule | null> {
  const db = getDb()
  const update: Partial<typeof crmReminderRules.$inferInsert> = {}
  if (data.name !== undefined) update.name = data.name
  if (data.trigger_event !== undefined) update.triggerEvent = data.trigger_event
  if (data.delay_days !== undefined) update.delayDays = data.delay_days
  if (data.channel !== undefined) update.channel = data.channel as 'email' | 'whatsapp' | 'both'
  if (data.message_template !== undefined) update.messageTemplate = data.message_template
  if (data.is_active !== undefined) update.isActive = data.is_active
  if (data.sort_order !== undefined) update.sortOrder = data.sort_order
  update.updatedAt = new Date()

  const [row] = await db.update(crmReminderRules).set(update).where(eq(crmReminderRules.id, id)).returning()
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    trigger_event: row.triggerEvent,
    delay_days: row.delayDays,
    channel: row.channel,
    message_template: row.messageTemplate,
    is_active: row.isActive,
    sort_order: row.sortOrder,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

export async function deleteReminderRule(id: string): Promise<boolean> {
  const db = getDb()
  const result = await db.delete(crmReminderRules).where(eq(crmReminderRules.id, id))
  return (result as unknown as { rowCount?: number }).rowCount !== 0
}

/** Build payment methods block for inclusion in reminder messages */
export function buildPaymentMethodsText(methods: PaymentMethod[]): string {
  const active = methods.filter((m) => m.active)
  if (!active.length) return ''
  const lines = active.map((m) => {
    const parts: string[] = [`💳 *${m.label}*`]
    if (m.number) parts.push(m.number)
    if (m.iban) parts.push(m.iban)
    if (m.instructions) parts.push(`_(${m.instructions})_`)
    return parts.join(' — ')
  })
  return `\n\n*Moyens de paiement acceptés :*\n${lines.join('\n')}`
}
