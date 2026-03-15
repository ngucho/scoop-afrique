/**
 * CRM dashboard — KPIs and aggregates
 */
import { eq, gte, lt, and, desc, inArray, notInArray } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import {
  crmInvoices,
  crmDevis,
  crmProjects,
  devisRequests,
  crmActivityLog,
} from '../../db/schema.js'
import { toSnakeRecord } from './crm-util.js'

export async function getDashboardKpis(): Promise<{
  revenueThisMonth: number
  pipelineAmount: number
  pipelineCount: number
  activeProjects: number
  overdueProjects: number
  unpaidInvoicesAmount: number
  unpaidInvoicesCount: number
  newDevisRequests: number
}> {
  const db = getDb()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = now.toISOString().slice(0, 10)

  // Revenue this month (paid invoices with paid_at in month)
  const paidInMonth = await db
    .select({ amountPaid: crmInvoices.amountPaid })
    .from(crmInvoices)
    .where(
      and(
        eq(crmInvoices.status, 'paid'),
        gte(crmInvoices.paidAt, monthStart)
      )
    )
  const revenueThisMonth = paidInMonth.reduce((s, i) => s + (Number(i.amountPaid) ?? 0), 0)

  // Pipeline (devis sent)
  const sentDevis = await db
    .select({ total: crmDevis.total })
    .from(crmDevis)
    .where(eq(crmDevis.status, 'sent'))
  const pipelineAmount = sentDevis.reduce((s, i) => s + (Number(i.total) ?? 0), 0)
  const pipelineCount = sentDevis.length

  // Active projects (in_progress, review, delivered)
  const activeProjectsRows = await db
    .select()
    .from(crmProjects)
    .where(inArray(crmProjects.status, ['in_progress', 'review', 'delivered']))
  const activeProjects = activeProjectsRows.length

  // Overdue projects (end_date < today, status not closed/cancelled)
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

  // Unpaid invoices (sent, partial, overdue)
  const unpaidInvoices = await db
    .select({ total: crmInvoices.total, amountPaid: crmInvoices.amountPaid })
    .from(crmInvoices)
    .where(inArray(crmInvoices.status, ['sent', 'partial', 'overdue']))
  const unpaidInvoicesAmount = unpaidInvoices.reduce(
    (s, i) => s + ((Number(i.total) ?? 0) - (Number(i.amountPaid) ?? 0)),
    0
  )
  const unpaidInvoicesCount = unpaidInvoices.length

  // New devis requests (last 7 days)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const newDevisRequestsRows = await db
    .select()
    .from(devisRequests)
    .where(gte(devisRequests.createdAt, weekAgo))
  const newDevisRequests = newDevisRequestsRows.length

  return {
    revenueThisMonth,
    pipelineAmount,
    pipelineCount,
    activeProjects,
    overdueProjects,
    unpaidInvoicesAmount,
    unpaidInvoicesCount,
    newDevisRequests,
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
