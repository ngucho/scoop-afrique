import { crmGetServer } from '@/lib/api-server'
import { resolveCrmDateRangeFromSearchParams } from '@/lib/crm-date-range'
import { ReportsClient } from '@/components/reports/ReportsClient'
import { FinancialReportClient } from '@/components/reports/FinancialReportClient'
import { CrmDateRangeBar } from '@/components/analytics/CrmDateRangeBar'
import { ExportBilanDialog } from '@/components/reports/ExportBilanDialog'
import { TrendingUp, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

type ReportSummary = {
  revenueByMonth: Array<{
    month: string
    revenue: number
    treasuryIncome?: number
    totalCashIn?: number
    count: number
  }>
  devisByStatus: Array<{ status: string; count: number; total: number }>
  pipelineFunnel: { draft: number; sent: number; accepted: number; rejected: number; expired: number }
  conversionRates: {
    devisSentToAccepted: number
    devisAcceptedToProject: number
    invoiceSentToPaid: number
  }
}

type FinancialSummary = {
  period: { start: string; end: string }
  revenue: number
  treasuryIncome?: number
  expenses: number
  treasuryExpense?: number
  grossProfit: number
  grossMargin: number
  invoicesIssued: number
  invoicesPaid: number
  invoicesUnpaid: number
  invoicesOverdue: number
  revenueByMonth: Array<{ month: string; revenue: number; count: number }>
  expensesByCategory: Array<{ category: string; amount: number; count: number }>
  cashFlow: Array<{ month: string; revenue: number; expenses: number; net: number }>
  topClients: Array<{ contact_id: string; name: string; revenue: number; invoiceCount: number }>
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { from, to } = resolveCrmDateRangeFromSearchParams(sp)

  const qReports = new URLSearchParams()
  qReports.set('from', from)
  qReports.set('to', to)
  qReports.set('months', '24')

  const qFin = new URLSearchParams()
  qFin.set('from', from)
  qFin.set('to', to)
  qFin.set('months', '24')

  const [reportRes, financialRes] = await Promise.all([
    crmGetServer<ReportSummary>(`reports?${qReports.toString()}`),
    crmGetServer<FinancialSummary>(`reports/financial?${qFin.toString()}`),
  ])

  const reportData = reportRes?.data ?? null
  const financialData = financialRes?.data ?? null

  return (
    <div className="space-y-8 max-w-[1200px] crm-fade-in">
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Rapports & Analytics</h1>
          <p className="crm-page-subtitle">Vue d&apos;ensemble de votre performance commerciale</p>
        </div>
      </div>

      <CrmDateRangeBar from={from} to={to} basePath="/reports" />

      {/* Financial overview */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
              Bilan financier
            </h2>
          </div>
          <ExportBilanDialog defaultFrom={from} defaultTo={to} />
        </div>
        <FinancialReportClient initialData={financialData} />
      </div>

      {/* Commercial reports */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
            Performance commerciale
          </h2>
        </div>
        <ReportsClient initialData={reportData} />
      </div>
    </div>
  )
}
