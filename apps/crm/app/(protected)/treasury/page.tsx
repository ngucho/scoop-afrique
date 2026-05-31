import { redirect } from 'next/navigation'
import { crmGetServer } from '@/lib/api-server'
import { getCrmRole } from '@/lib/crm-admin'
import { resolveCrmDateRangeFromSearchParams } from '@/lib/crm-date-range'
import { TreasuryClient } from '@/components/treasury/TreasuryClient'
import { listSearchFromParams, parseListView } from '@/lib/crm-list-query'

/** La plage de dates vient des searchParams : pas de cache RSC qui figerait la liste. */
export const dynamic = 'force-dynamic'

export default async function TreasuryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const role = await getCrmRole()
  if (role !== 'manager' && role !== 'admin') {
    redirect('/dashboard')
  }

  const sp = await searchParams
  const search = listSearchFromParams(sp)
  const view = parseListView(sp.view, 'list')
  const { from, to } = resolveCrmDateRangeFromSearchParams(sp)

  const qFin = new URLSearchParams()
  qFin.set('from', from)
  qFin.set('to', to)
  qFin.set('months', '24')

  const movQ = new URLSearchParams()
  movQ.set('limit', '500')
  movQ.set('sort', 'occurred_at')
  movQ.set('order', 'desc')
  movQ.set('from', from)
  movQ.set('to', to)
  if (search) movQ.set('search', search)

  const [summaryRes, movementsRes, projectsRes, financialRes] = await Promise.all([
    crmGetServer<{ income: number; expense: number; from: string; to: string }>(
      `treasury/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    ),
    crmGetServer<Array<Record<string, unknown>>>(`treasury?${movQ.toString()}`),
    crmGetServer<Array<Record<string, unknown>>>('projects?limit=100'),
    crmGetServer<{ cashFlow?: Array<{ month: string; revenue: number; expenses: number; net: number }> }>(
      `reports/financial?${qFin.toString()}`
    ),
  ])

  const summary = summaryRes?.data ?? { income: 0, expense: 0, from, to }
  const movements = movementsRes?.data ?? []
  const total = movementsRes?.total ?? movements.length
  const projects = (projectsRes?.data ?? []).map((p) => ({
    id: p.id as string,
    reference: String(p.reference ?? ''),
    title: String(p.title ?? ''),
  }))
  const cashFlow = financialRes?.data?.cashFlow ?? []

  return (
    <div className="space-y-6 crm-fade-in">
      <div className="crm-page-header max-w-[1200px]">
        <div>
          <h1 className="crm-page-title">Trésorerie</h1>
          <p className="crm-page-subtitle">
            Revenus et dépenses hors facturation (monétisation, dons, charges, etc.) — réservé aux managers
          </p>
        </div>
      </div>

      <TreasuryClient
        initialMovements={movements}
        initialTotal={total}
        summary={summary}
        rangeFrom={from}
        rangeTo={to}
        projects={projects}
        cashFlow={cashFlow}
        viewMode={view}
        initialSearch={search ?? ''}
      />
    </div>
  )
}
