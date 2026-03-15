import { crmGetServer } from '@/lib/api-server'
import { ReportsClient } from '@/components/reports/ReportsClient'
import { FinancialReportClient } from '@/components/reports/FinancialReportClient'
import { TrendingUp, DollarSign } from 'lucide-react'

type ReportSummary = {
  revenueByMonth: Array<{ month: string; revenue: number; count: number }>
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
  expenses: number
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

export default async function ReportsPage() {
  const [reportRes, financialRes] = await Promise.all([
    crmGetServer<ReportSummary>('reports?months=12'),
    crmGetServer<FinancialSummary>('reports/financial?months=12'),
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

      {/* Financial overview */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
            Bilan financier
          </h2>
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
