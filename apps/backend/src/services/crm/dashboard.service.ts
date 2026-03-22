/**
 * CRM dashboard — KPIs and aggregates
 */
import { eq, gte, lte, lt, and, desc, inArray, notInArray, sql } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import {
  crmInvoices,
  crmDevis,
  crmProjects,
  devisRequests,
  crmActivityLog,
  crmTreasuryMovements,
  crmExpenses,
  crmPayments,
} from '../../db/schema.js'
import { toSnakeRecord } from './crm-util.js'
import { monthKeysInclusive } from './reports.service.js'

export type DashboardCashMonth = {
  month: string
  cashIn: number
  cashOut: number
  net: number
}

export type DashboardKpis = {
  period: { from: string; to: string }
  /** Compat UI : entrées totales (factures encaissées + revenus trésorerie) */
  revenueThisMonth: number
  invoiceRevenueInPeriod: number
  treasuryIncomeInPeriod: number
  totalCashIn: number
  projectExpensesInPeriod: number
  treasuryExpenseInPeriod: number
  totalCashOut: number
  netCashFlow: number
  pipelineAmount: number
  pipelineCount: number
  activeProjects: number
  overdueProjects: number
  unpaidInvoicesAmount: number
  unpaidInvoicesCount: number
  newDevisRequests: number
  cashFlowByMonth: DashboardCashMonth[]
}

const MAX_DASHBOARD_MONTHS = 24

export async function getDashboardKpis(opts?: { from?: string; to?: string }): Promise<DashboardKpis> {
  const db = getDb()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  let fromStr: string
  let toStr: string
  if (opts?.from && opts?.to && /^\d{4}-\d{2}-\d{2}$/.test(opts.from) && /^\d{4}-\d{2}-\d{2}$/.test(opts.to)) {
    fromStr = opts.from <= opts.to ? opts.from : opts.to
    toStr = opts.from <= opts.to ? opts.to : opts.from
  } else {
    fromStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    toStr = today
  }

  /** Encaissements sur la période = somme des paiements (date de paiement) */
  const paymentsInRange = await db
    .select({
      amount: crmPayments.amount,
      paidAt: crmPayments.paidAt,
    })
    .from(crmPayments)
    .innerJoin(crmInvoices, eq(crmPayments.invoiceId, crmInvoices.id))
    .where(
      and(
        eq(crmInvoices.isArchived, false),
        gte(crmPayments.paidAt, new Date(`${fromStr}T00:00:00Z`)),
        lte(crmPayments.paidAt, new Date(`${toStr}T23:59:59Z`))
      )
    )

  let invoiceRevenueInPeriod = 0
  for (const row of paymentsInRange) {
    invoiceRevenueInPeriod += Number(row.amount) ?? 0
  }

  const treasuryRows = await db
    .select({
      direction: crmTreasuryMovements.direction,
      amount: crmTreasuryMovements.amount,
      occurredAt: crmTreasuryMovements.occurredAt,
    })
    .from(crmTreasuryMovements)
    .where(
      and(
        sql`${crmTreasuryMovements.occurredAt} >= ${fromStr}::date`,
        sql`${crmTreasuryMovements.occurredAt} <= ${toStr}::date`
      )
    )

  let treasuryIncomeInPeriod = 0
  let treasuryExpenseInPeriod = 0
  for (const t of treasuryRows) {
    const a = Number(t.amount) ?? 0
    if (t.direction === 'income') treasuryIncomeInPeriod += a
    else treasuryExpenseInPeriod += a
  }

  const expenseRows = await db
    .select({ amount: crmExpenses.amount, incurredAt: crmExpenses.incurredAt })
    .from(crmExpenses)
    .where(
      and(gte(crmExpenses.incurredAt, fromStr), lte(crmExpenses.incurredAt, toStr))
    )

  const projectExpensesInPeriod = expenseRows.reduce((s, e) => s + (Number(e.amount) ?? 0), 0)

  const totalCashIn = invoiceRevenueInPeriod + treasuryIncomeInPeriod
  const totalCashOut = projectExpensesInPeriod + treasuryExpenseInPeriod
  const netCashFlow = totalCashIn - totalCashOut

  // Pipeline (devis sent) — toujours temps réel
  const sentDevis = await db
    .select({ total: crmDevis.total })
    .from(crmDevis)
    .where(eq(crmDevis.status, 'sent'))
  const pipelineAmount = sentDevis.reduce((s, i) => s + (Number(i.total) ?? 0), 0)
  const pipelineCount = sentDevis.length

  const activeProjectsRows = await db
    .select()
    .from(crmProjects)
    .where(inArray(crmProjects.status, ['in_progress', 'review', 'delivered']))
  const activeProjects = activeProjectsRows.length

  const overdueProjectsRows = await db
    .select()
    .from(crmProjects)
    .where(
      and(
        lt(crmProjects.endDate, today),
        notInArray(crmProjects.status, ['closed', 'cancelled'])
      )
    )
  const overdueProjects = overdueProjectsRows.length

  const unpaidInvoices = await db
    .select({ total: crmInvoices.total, amountPaid: crmInvoices.amountPaid })
    .from(crmInvoices)
    .where(inArray(crmInvoices.status, ['sent', 'partial', 'overdue']))
  const unpaidInvoicesAmount = unpaidInvoices.reduce(
    (s, i) => s + ((Number(i.total) ?? 0) - (Number(i.amountPaid) ?? 0)),
    0
  )
  const unpaidInvoicesCount = unpaidInvoices.length

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const newDevisRequestsRows = await db
    .select()
    .from(devisRequests)
    .where(gte(devisRequests.createdAt, weekAgo))
  const newDevisRequests = newDevisRequestsRows.length

  // Série mensuelle (entrées = factures + trésorerie revenus ; sorties = dépenses projet + trésorerie)
  let monthKeys = monthKeysInclusive(fromStr, toStr)
  if (monthKeys.length > MAX_DASHBOARD_MONTHS) {
    monthKeys = monthKeys.slice(-MAX_DASHBOARD_MONTHS)
  }
  const byMonth = new Map<string, { in: number; out: number }>()
  for (const m of monthKeys) {
    byMonth.set(m, { in: 0, out: 0 })
  }

  for (const row of paymentsInRange) {
    if (!row.paidAt) continue
    const key =
      row.paidAt instanceof Date ? row.paidAt.toISOString().slice(0, 7) : String(row.paidAt).slice(0, 7)
    const cur = byMonth.get(key)
    if (cur) cur.in += Number(row.amount) ?? 0
  }
  for (const t of treasuryRows) {
    const dateStr = t.occurredAt ? String(t.occurredAt) : ''
    const key = dateStr.slice(0, 7)
    const cur = byMonth.get(key)
    if (!cur) continue
    const a = Number(t.amount) ?? 0
    if (t.direction === 'income') cur.in += a
    else cur.out += a
  }
  for (const e of expenseRows) {
    const dateStr = e.incurredAt ? String(e.incurredAt) : ''
    const key = dateStr.slice(0, 7)
    const cur = byMonth.get(key)
    if (cur) cur.out += Number(e.amount) ?? 0
  }

  const cashFlowByMonth: DashboardCashMonth[] = monthKeys.map((month) => {
    const v = byMonth.get(month) ?? { in: 0, out: 0 }
    return { month, cashIn: v.in, cashOut: v.out, net: v.in - v.out }
  })

  return {
    period: { from: fromStr, to: toStr },
    revenueThisMonth: totalCashIn,
    invoiceRevenueInPeriod,
    treasuryIncomeInPeriod,
    totalCashIn,
    projectExpensesInPeriod,
    treasuryExpenseInPeriod,
    totalCashOut,
    netCashFlow,
    pipelineAmount,
    pipelineCount,
    activeProjects,
    overdueProjects,
    unpaidInvoicesAmount,
    unpaidInvoicesCount,
    newDevisRequests,
    cashFlowByMonth,
  }
}

export async function getRecentActivity(limit = 20): Promise<Array<Record<string, unknown>>> {
  const db = getDb()
  const rows = await db
    .select()
    .from(crmActivityLog)
    .orderBy(desc(crmActivityLog.createdAt))
    .limit(limit)
  return rows.map((r) => toSnakeRecord(r as Record<string, unknown>))
}
