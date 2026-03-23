/**
 * CRM reports — analytics and aggregates for dashboards
 */
import { eq, gte, lte, and, sql } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import {
  crmInvoices,
  crmDevis,
  crmProjects,
  crmExpenses,
  crmContacts,
  crmTreasuryMovements,
  crmPayments,
} from '../../db/schema.js'

/** Mois calendaires YYYY-MM entre deux dates inclusives (startStr <= endStr, format YYYY-MM-DD). */
export function monthKeysInclusive(startStr: string, endStr: string): string[] {
  const keys: string[] = []
  const start = startStr.slice(0, 10)
  const end = endStr.slice(0, 10)
  const sm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start)
  const em = /^(\d{4})-(\d{2})-(\d{2})$/.exec(end)
  if (!sm || !em) return keys
  let y = Number(sm[1])
  let m = Number(sm[2])
  const ye = Number(em[1])
  const me = Number(em[2])
  while (y < ye || (y === ye && m <= me)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return keys
}

/** Dernier jour du mois YYYY-MM (pour bornes SQL). */
function lastDayOfMonthYm(ym: string): string {
  const [y, mo] = ym.split('-').map(Number)
  const d = new Date(y, mo, 0).getDate()
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export type RevenueByMonth = {
  month: string
  /** Encaissements factures (payées / partielles) */
  revenue: number
  /** Revenus hors facture (flux trésorerie) */
  treasuryIncome: number
  /** Total entrées = revenue + treasuryIncome */
  totalCashIn: number
  count: number
}
export type DevisByStatus = { status: string; count: number; total: number }
export type PipelineFunnel = {
  draft: number
  sent: number
  accepted: number
  rejected: number
  expired: number
}

export async function getRevenueByMonth(
  months = 12,
  range?: { from: string; to: string }
): Promise<RevenueByMonth[]> {
  const db = getDb()

  let monthOrder: string[]
  let queryFrom: string
  let queryTo: string

  if (range?.from && range?.to) {
    const a = range.from <= range.to ? range.from : range.to
    const b = range.from <= range.to ? range.to : range.from
    monthOrder = monthKeysInclusive(a, b)
    if (monthOrder.length > 36) {
      monthOrder = monthOrder.slice(-36)
    }
    queryFrom = a
    queryTo = b
  } else {
    const resultMonths: string[] = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      resultMonths.push(d.toISOString().slice(0, 7))
    }
    monthOrder = resultMonths
    const firstYm = monthOrder[0]
    const lastYm = monthOrder[monthOrder.length - 1]
    queryFrom = `${firstYm}-01`
    queryTo = lastDayOfMonthYm(lastYm)
  }

  /** Entrées factures : somme des paiements par date de paiement */
  const paymentRows = await db
    .select({
      paidAt: crmPayments.paidAt,
      amount: crmPayments.amount,
    })
    .from(crmPayments)
    .innerJoin(crmInvoices, eq(crmPayments.invoiceId, crmInvoices.id))
    .where(
      and(
        eq(crmInvoices.isArchived, false),
        gte(crmPayments.paidAt, new Date(`${queryFrom}T00:00:00Z`)),
        lte(crmPayments.paidAt, new Date(`${queryTo}T23:59:59Z`))
      )
    )

  const byMonthInv = new Map<string, { revenue: number; count: number }>()
  for (const row of paymentRows) {
    if (!row.paidAt) continue
    const d = row.paidAt instanceof Date ? row.paidAt.toISOString() : String(row.paidAt)
    const month = d.slice(0, 7)
    const amount = Number(row.amount) ?? 0
    const cur = byMonthInv.get(month) ?? { revenue: 0, count: 0 }
    cur.revenue += amount
    cur.count += 1
    byMonthInv.set(month, cur)
  }

  const treasuryRows = await db
    .select({
      occurredAt: crmTreasuryMovements.occurredAt,
      amount: crmTreasuryMovements.amount,
      direction: crmTreasuryMovements.direction,
    })
    .from(crmTreasuryMovements)
    .where(
      and(
        eq(crmTreasuryMovements.direction, 'income'),
        sql`${crmTreasuryMovements.occurredAt} >= ${queryFrom}::date`,
        sql`${crmTreasuryMovements.occurredAt} <= ${queryTo}::date`
      )
    )

  const byMonthTreasury = new Map<string, number>()
  for (const row of treasuryRows) {
    const dateStr = row.occurredAt ? String(row.occurredAt) : ''
    const month = dateStr.slice(0, 7)
    if (!month || month.length < 7) continue
    const a = Number(row.amount) ?? 0
    byMonthTreasury.set(month, (byMonthTreasury.get(month) ?? 0) + a)
  }

  const result: RevenueByMonth[] = []
  for (const month of monthOrder) {
    const inv = byMonthInv.get(month) ?? { revenue: 0, count: 0 }
    const treasuryIncome = byMonthTreasury.get(month) ?? 0
    result.push({
      month,
      revenue: inv.revenue,
      treasuryIncome,
      totalCashIn: inv.revenue + treasuryIncome,
      count: inv.count,
    })
  }
  return result
}

export async function getDevisByStatus(): Promise<DevisByStatus[]> {
  const db = getDb()
  const rows = await db.select({ status: crmDevis.status, total: crmDevis.total }).from(crmDevis)

  const byStatus = new Map<string, { count: number; total: number }>()
  for (const row of rows) {
    const status = (row.status as string) ?? 'draft'
    const cur = byStatus.get(status) ?? { count: 0, total: 0 }
    cur.count += 1
    cur.total += Number(row.total) ?? 0
    byStatus.set(status, cur)
  }

  const order = ['draft', 'sent', 'accepted', 'rejected', 'expired']
  return order.map((status) => {
    const cur = byStatus.get(status) ?? { count: 0, total: 0 }
    return { status, count: cur.count, total: cur.total }
  })
}

export async function getPipelineFunnel(): Promise<PipelineFunnel> {
  const byStatus = await getDevisByStatus()
  const map = Object.fromEntries(byStatus.map((s) => [s.status, s.count]))
  return {
    draft: map.draft ?? 0,
    sent: map.sent ?? 0,
    accepted: map.accepted ?? 0,
    rejected: map.rejected ?? 0,
    expired: map.expired ?? 0,
  }
}

export async function getConversionRates(): Promise<{
  devisSentToAccepted: number
  devisAcceptedToProject: number
  invoiceSentToPaid: number
}> {
  const db = getDb()

  const [devisRows, projectRows, invoiceRows] = await Promise.all([
    db.select({ status: crmDevis.status }).from(crmDevis),
    db.select({ id: crmProjects.id }).from(crmProjects),
    db.select({ status: crmInvoices.status }).from(crmInvoices),
  ])

  const sent = devisRows.filter((d) => d.status === 'sent').length
  const accepted = devisRows.filter((d) => d.status === 'accepted').length
  const projectCount = projectRows.length
  const invSent = invoiceRows.filter(
    (i) => i.status === 'sent' || i.status === 'partial' || i.status === 'overdue'
  ).length
  const invPaid = invoiceRows.filter((i) => i.status === 'paid').length

  return {
    devisSentToAccepted: sent > 0 ? Math.round((accepted / sent) * 100) : 0,
    devisAcceptedToProject: accepted > 0 ? Math.round((projectCount / accepted) * 100) : 0,
    invoiceSentToPaid: invSent + invPaid > 0 ? Math.round((invPaid / (invSent + invPaid)) * 100) : 0,
  }
}

export async function getReportsSummary(
  months = 12,
  range?: { from: string; to: string }
): Promise<{
  revenueByMonth: RevenueByMonth[]
  devisByStatus: DevisByStatus[]
  pipelineFunnel: PipelineFunnel
  conversionRates: Awaited<ReturnType<typeof getConversionRates>>
}> {
  const [revenueByMonth, devisByStatus, pipelineFunnel, conversionRates] = await Promise.all([
    getRevenueByMonth(months, range),
    getDevisByStatus(),
    getPipelineFunnel(),
    getConversionRates(),
  ])
  return { revenueByMonth, devisByStatus, pipelineFunnel, conversionRates }
}

export type FinancialSummary = {
  period: { start: string; end: string }
  revenue: number
  treasuryIncome: number
  expenses: number
  treasuryExpense: number
  grossProfit: number
  grossMargin: number
  invoicesIssued: number
  invoicesPaid: number
  invoicesUnpaid: number
  invoicesOverdue: number
  revenueByMonth: RevenueByMonth[]
  expensesByCategory: Array<{ category: string; amount: number; count: number }>
  cashFlow: Array<{ month: string; revenue: number; expenses: number; net: number }>
  topClients: Array<{ contact_id: string; name: string; revenue: number; invoiceCount: number }>
}

export async function getFinancialSummary(
  startDate?: string,
  endDate?: string,
  months = 12
): Promise<FinancialSummary> {
  const db = getDb()

  const end = endDate ? new Date(endDate) : new Date()
  const start = startDate
    ? new Date(startDate)
    : (() => {
        const d = new Date()
        d.setMonth(d.getMonth() - months)
        return d
      })()

  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  /** Factures « dans la période » : date d'échéance, ou date de création si pas d'échéance */
  const invoiceInPeriod = sql`COALESCE(${crmInvoices.dueDate}, (${crmInvoices.createdAt}::date))`

  const [invoices, paymentRows, expenses, treasuryRows, contacts] = await Promise.all([
    db
      .select({
        id: crmInvoices.id,
        status: crmInvoices.status,
        total: crmInvoices.total,
        amountPaid: crmInvoices.amountPaid,
        dueDate: crmInvoices.dueDate,
        paidAt: crmInvoices.paidAt,
        contactId: crmInvoices.contactId,
        createdAt: crmInvoices.createdAt,
      })
      .from(crmInvoices)
      .where(
        and(
          eq(crmInvoices.isArchived, false),
          sql`${invoiceInPeriod} >= ${startStr}::date`,
          sql`${invoiceInPeriod} <= ${endStr}::date`
        )
      ),
    db
      .select({
        id: crmPayments.id,
        amount: crmPayments.amount,
        paidAt: crmPayments.paidAt,
        invoiceId: crmPayments.invoiceId,
        contactId: crmInvoices.contactId,
      })
      .from(crmPayments)
      .innerJoin(crmInvoices, eq(crmPayments.invoiceId, crmInvoices.id))
      .where(
        and(
          eq(crmInvoices.isArchived, false),
          gte(crmPayments.paidAt, new Date(`${startStr}T00:00:00Z`)),
          lte(crmPayments.paidAt, new Date(`${endStr}T23:59:59Z`))
        )
      ),
    db
      .select({
        amount: crmExpenses.amount,
        category: crmExpenses.category,
        incurredAt: crmExpenses.incurredAt,
      })
      .from(crmExpenses)
      .where(
        and(
          gte(crmExpenses.incurredAt, startStr),
          lte(crmExpenses.incurredAt, endStr)
        )
      ),
    db
      .select({
        direction: crmTreasuryMovements.direction,
        amount: crmTreasuryMovements.amount,
        occurredAt: crmTreasuryMovements.occurredAt,
        category: crmTreasuryMovements.category,
      })
      .from(crmTreasuryMovements)
      .where(
        and(
          sql`${crmTreasuryMovements.occurredAt} >= ${startStr}::date`,
          sql`${crmTreasuryMovements.occurredAt} <= ${endStr}::date`
        )
      ),
    db.select({
      id: crmContacts.id,
      firstName: crmContacts.firstName,
      lastName: crmContacts.lastName,
      company: crmContacts.company,
    }).from(crmContacts),
  ])

  // Entrées factures = somme des paiements dont la date de paiement est dans la période
  const revenue = paymentRows.reduce((sum, p) => sum + (Number(p.amount) ?? 0), 0)

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) ?? 0), 0)

  let treasuryIncome = 0
  let treasuryExpense = 0
  for (const t of treasuryRows) {
    const a = Number(t.amount) ?? 0
    if (t.direction === 'income') treasuryIncome += a
    else treasuryExpense += a
  }

  // Synthèse factures (échéance / création dans la période)
  const now = new Date()
  const invoicesPaid = invoices.filter((i) => i.status === 'paid').length
  const invoicesOverdue = invoices.filter(
    (i) => i.status !== 'paid' && i.dueDate && new Date(String(i.dueDate)) < now
  ).length
  const invoicesUnpaid = invoices.filter(
    (i) => i.status !== 'paid' && (!i.dueDate || new Date(String(i.dueDate)) >= now)
  ).length

  // Expenses by category
  const expCatMap = new Map<string, { amount: number; count: number }>()
  for (const e of expenses) {
    const cat = (e.category as string) || 'Autre'
    const cur = expCatMap.get(cat) ?? { amount: 0, count: 0 }
    cur.amount += Number(e.amount) ?? 0
    cur.count += 1
    expCatMap.set(cat, cur)
  }
  for (const t of treasuryRows) {
    if (t.direction !== 'expense') continue
    const cat = `trésorerie:${(t.category as string) || 'autre'}`
    const cur = expCatMap.get(cat) ?? { amount: 0, count: 0 }
    cur.amount += Number(t.amount) ?? 0
    cur.count += 1
    expCatMap.set(cat, cur)
  }
  const expensesByCategory = Array.from(expCatMap.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.amount - a.amount)

  // Cash flow by month — tous les mois calendaires de la période (pas d'approximation en jours)
  const cashFlowMap = new Map<string, { revenue: number; expenses: number }>()
  for (const key of monthKeysInclusive(startStr, endStr)) {
    cashFlowMap.set(key, { revenue: 0, expenses: 0 })
  }
  for (const p of paymentRows) {
    if (!p.paidAt) continue
    const key =
      p.paidAt instanceof Date ? p.paidAt.toISOString().slice(0, 7) : String(p.paidAt).slice(0, 7)
    const cur = cashFlowMap.get(key)
    if (cur) cur.revenue += Number(p.amount) ?? 0
  }
  for (const exp of expenses) {
    const dateStr = exp.incurredAt ? String(exp.incurredAt) : ''
    const key = dateStr.slice(0, 7)
    const cur = cashFlowMap.get(key)
    if (cur) cur.expenses += Number(exp.amount) ?? 0
  }
  for (const t of treasuryRows) {
    const dateStr = t.occurredAt ? String(t.occurredAt) : ''
    const key = dateStr.slice(0, 7)
    const cur = cashFlowMap.get(key)
    if (!cur) continue
    const a = Number(t.amount) ?? 0
    if (t.direction === 'income') cur.revenue += a
    else cur.expenses += a
  }
  const cashFlow = Array.from(cashFlowMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v, net: v.revenue - v.expenses }))

  // Série revenus (factures vs trésorerie) alignée sur le flux de trésorerie mensuel
  const treasuryInByMonth = new Map<string, number>()
  for (const t of treasuryRows) {
    if (t.direction !== 'income') continue
    const dateStr = t.occurredAt ? String(t.occurredAt) : ''
    const key = dateStr.slice(0, 7)
    if (!key || key.length < 7) continue
    const a = Number(t.amount) ?? 0
    treasuryInByMonth.set(key, (treasuryInByMonth.get(key) ?? 0) + a)
  }

  const revenueByMonth: RevenueByMonth[] = cashFlow.map((cf) => {
    let invPart = 0
    let payCount = 0
    for (const p of paymentRows) {
      if (!p.paidAt) continue
      const m =
        p.paidAt instanceof Date ? p.paidAt.toISOString().slice(0, 7) : String(p.paidAt).slice(0, 7)
      if (m !== cf.month) continue
      invPart += Number(p.amount) ?? 0
      payCount += 1
    }
    const treasuryIncomeM = treasuryInByMonth.get(cf.month) ?? 0
    return {
      month: cf.month,
      revenue: invPart,
      treasuryIncome: treasuryIncomeM,
      totalCashIn: invPart + treasuryIncomeM,
      count: payCount,
    }
  })

  // Top clients : encaissements par date de paiement
  const clientRevMap = new Map<string, { revenue: number; invoiceCount: number }>()
  const clientInvoicesTouched = new Map<string, Set<string>>()
  for (const p of paymentRows) {
    const cid = p.contactId
    if (!cid) continue
    const cur = clientRevMap.get(cid) ?? { revenue: 0, invoiceCount: 0 }
    cur.revenue += Number(p.amount) ?? 0
    const set = clientInvoicesTouched.get(cid) ?? new Set()
    set.add(String(p.invoiceId))
    clientInvoicesTouched.set(cid, set)
    cur.invoiceCount = set.size
    clientRevMap.set(cid, cur)
  }
  const contactMap = new Map(contacts.map((c) => [c.id, c]))
  const topClients = Array.from(clientRevMap.entries())
    .map(([contact_id, v]) => {
      const c = contactMap.get(contact_id)
      const name = c
        ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || (c.company as string) || 'Client'
        : 'Client'
      return { contact_id, name, ...v }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const totalRevenueLike = revenue + treasuryIncome
  const totalExpenseLike = totalExpenses + treasuryExpense

  return {
    period: { start: startStr, end: endStr },
    revenue,
    treasuryIncome,
    expenses: totalExpenses,
    treasuryExpense,
    grossProfit: totalRevenueLike - totalExpenseLike,
    grossMargin:
      totalRevenueLike > 0
        ? Math.round(((totalRevenueLike - totalExpenseLike) / totalRevenueLike) * 100)
        : 0,
    invoicesIssued: invoices.length,
    invoicesPaid,
    invoicesUnpaid,
    invoicesOverdue,
    revenueByMonth,
    expensesByCategory,
    cashFlow,
    topClients,
  }
}
