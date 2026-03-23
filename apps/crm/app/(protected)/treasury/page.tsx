import { redirect } from 'next/navigation'
import { crmGetServer } from '@/lib/api-server'
import { getCrmRole } from '@/lib/crm-admin'
import { TreasuryClient } from '@/components/treasury/TreasuryClient'

/** La plage de dates vient des searchParams : pas de cache RSC qui figerait la liste. */
export const dynamic = 'force-dynamic'

function rawDate(sp: Record<string, string | string[] | undefined>, k: string): string | undefined {
  const v = sp[k]
  const s = Array.isArray(v) ? v[0] : v
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  return s
}

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
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 12)
  const defaultFrom = start.toISOString().slice(0, 10)
  const defaultTo = end.toISOString().slice(0, 10)
  let from = rawDate(sp, 'from') ?? defaultFrom
  let to = rawDate(sp, 'to') ?? defaultTo
  if (from > to) {
    const tmp = from
    from = to
    to = tmp
  }

  const qFin = new URLSearchParams()
  qFin.set('start', from)
  qFin.set('end', to)
  qFin.set('months', '24')

  const [summaryRes, movementsRes, projectsRes, financialRes] = await Promise.all([
    crmGetServer<{ income: number; expense: number; from: string; to: string }>(
      `treasury/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    ),
    crmGetServer<Array<Record<string, unknown>>>(
      `treasury?limit=500&sort=occurred_at&order=desc&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    ),
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
      />
    </div>
  )
}
