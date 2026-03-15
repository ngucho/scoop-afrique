/**
 * CRM dashboard — KPIs and aggregates
 */
import { getSupabase } from '../../lib/supabase.js'

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
  const supabase = getSupabase()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const today = now.toISOString().slice(0, 10)

  // Revenue this month (paid invoices)
  const { data: paidInvoices } = await supabase
    .from('crm_invoices')
    .select('amount_paid')
    .eq('status', 'paid')
    .gte('paid_at', `${monthStart}T00:00:00Z`)
  const revenueThisMonth = (paidInvoices ?? []).reduce((s, i) => s + ((i.amount_paid as number) ?? 0), 0)

  // Pipeline (devis sent)
  const { data: sentDevis } = await supabase
    .from('crm_devis')
    .select('total')
    .eq('status', 'sent')
  const pipelineAmount = (sentDevis ?? []).reduce((s, i) => s + ((i.total as number) ?? 0), 0)
  const pipelineCount = sentDevis?.length ?? 0

  // Active projects (in_progress, review, delivered)
  const { count: activeCount } = await supabase
    .from('crm_projects')
    .select('*', { count: 'exact', head: true })
    .in('status', ['in_progress', 'review', 'delivered'])

  // Overdue projects (end_date < today, status not closed)
  const { count: overdueCount } = await supabase
    .from('crm_projects')
    .select('*', { count: 'exact', head: true })
    .lt('end_date', today)
    .not('status', 'in', '("closed","cancelled")')

  // Unpaid invoices (sent, partial, overdue)
  const { data: unpaidInvoices } = await supabase
    .from('crm_invoices')
    .select('total, amount_paid')
    .in('status', ['sent', 'partial', 'overdue'])
  const unpaidInvoicesAmount = (unpaidInvoices ?? []).reduce(
    (s, i) => s + (((i.total as number) ?? 0) - ((i.amount_paid as number) ?? 0)),
    0
  )
  const unpaidInvoicesCount = unpaidInvoices?.length ?? 0

  // New devis requests (last 7 days)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: newDevisRequests } = await supabase
    .from('devis_requests')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo)

  return {
    revenueThisMonth,
    pipelineAmount,
    pipelineCount,
    activeProjects: activeCount ?? 0,
    overdueProjects: overdueCount ?? 0,
    unpaidInvoicesAmount,
    unpaidInvoicesCount,
    newDevisRequests: newDevisRequests ?? 0,
  }
}

export async function getRecentActivity(limit = 20): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as Array<Record<string, unknown>>
}
