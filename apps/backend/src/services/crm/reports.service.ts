/**
 * CRM reports — analytics and aggregates for dashboards
 */
import { eq, gte, lte, and } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import {
  crmInvoices,
  crmDevis,
  crmProjects,
  crmExpenses,
  crmContacts,
} from '../../db/schema.js'

export type RevenueByMonth = { month: string; revenue: number; count: number }
export type DevisByStatus = { status: string; count: number; total: number }
export type PipelineFunnel = {
  draft: number
  sent: number
  accepted: number
  rejected: number
  expired: number
}

export async function getRevenueByMonth(months = 12): Promise<RevenueByMonth[]> {
  const db = getDb()
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const from = cutoff.toISOString().slice(0, 10)

  const rows = await db
    .select({ paidAt: crmInvoices.paidAt, amountPaid: crmInvoices.amountPaid })
    .from(crmInvoices)
    .where(
      and(
        eq(crmInvoices.status, 'paid'),
        gte(crmInvoices.paidAt, new Date(`${from}T00:00:00Z`))
      )
    )

  const byMonth = new Map<string, { revenue: number; count: number }>()
  for (const row of rows) {
    if (!row.paidAt) continue
    const d = row.paidAt instanceof Date ? row.paidAt.toISOString() : String(row.paidAt)
    const month = d.slice(0, 7)
    const amount = Number(row.amountPaid) ?? 0
    const cur = byMonth.get(month) ?? { revenue: 0, count: 0 }
    cur.revenue += amount
    cur.count += 1
    byMonth.set(month, cur)
  }

  const result: RevenueByMonth[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const month = d.toISOString().slice(0, 7)
    const cur = byMonth.get(month) ?? { revenue: 0, count: 0 }
    result.push({ month, revenue: cur.revenue, count: cur.count })
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

export async function getReportsSummary(months = 12): Promise<{
  revenueByMonth: RevenueByMonth[]
  devisByStatus: DevisByStatus[]
  pipelineFunnel: PipelineFunnel
  conversionRates: Awaited<ReturnType<typeof getConversionRates>>
}> {
  const [revenueByMonth, devisByStatus, pipelineFunnel, conversionRates] = await Promise.all([
    getRevenueByMonth(months),
    getDevisByStatus(),
    getPipelineFunnel(),
    getConversionRates(),
  ])
  return { revenueByMonth, devisByStatus, pipelineFunnel, conversionRates }
}

export type FinancialSummary = {
  period: { start: string; end: string }
  revenue: number
  expenses: number
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

  const [invoices, expenses, contacts] = await Promise.all([
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
          gte(crmInvoices.createdAt, new Date(`${startStr}T00:00:00Z`)),
          lte(crmInvoices.createdAt, new Date(`${endStr}T23:59:59Z`))
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
    db.select({
      id: crmContacts.id,
      firstName: crmContacts.firstName,
      lastName: crmContacts.lastName,
      company: crmContacts.company,
    }).from(crmContacts),
  ])

  // Revenue = sum of amount_paid on paid/partial invoices in period
  const revenue = invoices
    .filter((i) => i.status === 'paid' || i.status === 'partial')
    .reduce((sum, i) => sum + (Number(i.amountPaid) ?? 0), 0)

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) ?? 0), 0)

  // Invoices summary
  const now = new Date()
  const invoicesPaid = invoices.filter((i) => i.status === 'paid').length
  const invoicesOverdue = invoices.filter(
    (i) => i.status !== 'paid' && i.dueDate && new Date(i.dueDate) < now
  ).length
  const invoicesUnpaid = invoices.filter(
    (i) => i.status !== 'paid' && (!i.dueDate || new Date(i.dueDate) >= now)
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
  const expensesByCategory = Array.from(expCatMap.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.amount - a.amount)

  // Cash flow by month
  const monthsCount = Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000)) + 1
  const cashFlowMap = new Map<string, { revenue: number; expenses: number }>()
  for (let i = 0; i < Math.min(monthsCount, 24); i++) {
    const d = new Date(start)
    d.setMonth(d.getMonth() + i)
    const key = d.toISOString().slice(0, 7)
    cashFlowMap.set(key, { revenue: 0, expenses: 0 })
  }
  for (const inv of invoices) {
    if ((inv.status === 'paid' || inv.status === 'partial') && inv.paidAt) {
      const key =
        inv.paidAt instanceof Date ? inv.paidAt.toISOString().slice(0, 7) : String(inv.paidAt).slice(0, 7)
      const cur = cashFlowMap.get(key)
      if (cur) cur.revenue += Number(inv.amountPaid) ?? 0
    }
  }
  for (const exp of expenses) {
    const dateStr = exp.incurredAt ? String(exp.incurredAt) : ''
    const key = dateStr.slice(0, 7)
    const cur = cashFlowMap.get(key)
    if (cur) cur.expenses += Number(exp.amount) ?? 0
  }
  const cashFlow = Array.from(cashFlowMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v, net: v.revenue - v.expenses }))

  // Revenue by month (subset of cashflow)
  const revenueByMonth: RevenueByMonth[] = cashFlow.map((cf) => ({
    month: cf.month,
    revenue: cf.revenue,
    count: invoices.filter((i) => {
      const m = i.paidAt
        ? (i.paidAt instanceof Date ? i.paidAt.toISOString() : String(i.paidAt)).slice(0, 7)
        : null
      return m === cf.month && (i.status === 'paid' || i.status === 'partial')
    }).length,
  }))

  // Top clients
  const clientRevMap = new Map<string, { revenue: number; invoiceCount: number }>()
  for (const inv of invoices) {
    if (!inv.contactId) continue
    const cur = clientRevMap.get(inv.contactId) ?? { revenue: 0, invoiceCount: 0 }
    cur.revenue += Number(inv.amountPaid) ?? 0
    cur.invoiceCount += 1
    clientRevMap.set(inv.contactId, cur)
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

  return {
    period: { start: startStr, end: endStr },
    revenue,
    expenses: totalExpenses,
    grossProfit: revenue - totalExpenses,
    grossMargin: revenue > 0 ? Math.round(((revenue - totalExpenses) / revenue) * 100) : 0,
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
