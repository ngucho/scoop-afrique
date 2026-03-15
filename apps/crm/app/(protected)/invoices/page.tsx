import Link from 'next/link'
import { Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { Plus, Receipt, ArrowRight, AlertCircle } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  partial: 'Paiement partiel',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
}

function formatMoney(amount: number, currency = 'FCFA'): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

export default async function InvoicesPage() {
  const result = await crmGetServer<Array<Record<string, unknown>>>('invoices?limit=100')
  const invoices = result?.data ?? []

  const totalUnpaid = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + (Number(i.total) - Number(i.amount_paid || 0)), 0)
  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.amount_paid || 0), 0)
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length

  return (
    <div className="space-y-6 max-w-[1200px] crm-fade-in">
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Factures</h1>
          <p className="crm-page-subtitle">{invoices.length} facture{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/invoices/new">
          <Button className="flex items-center gap-2 rounded-full px-5 font-semibold">
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Encaissé', value: formatMoney(totalPaid), color: 'oklch(0.42 0.14 145)' },
            { label: 'À encaisser', value: formatMoney(totalUnpaid), color: 'oklch(0.5 0.2 40)' },
            { label: 'En retard', value: `${overdueCount} facture${overdueCount !== 1 ? 's' : ''}`, color: overdueCount > 0 ? 'oklch(0.5 0.18 20)' : 'var(--muted-foreground)' },
          ].map((s) => (
            <div key={s.label} className="crm-card p-4 crm-fade-in">
              <p className="text-xl font-bold tracking-tight truncate" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="crm-card">
          <div className="crm-empty py-16">
            <Receipt className="crm-empty-icon h-12 w-12" />
            <p className="crm-empty-title">Aucune facture</p>
            <p className="text-sm text-muted-foreground">Créez votre première facture</p>
            <Link href="/invoices/new">
              <Button className="mt-4 rounded-full px-5">Créer une facture</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="crm-card overflow-hidden">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Statut</th>
                <th className="hidden md:table-cell">Échéance</th>
                <th className="text-right">Total</th>
                <th className="text-right hidden sm:table-cell">Payé</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const status = String(inv.status ?? 'draft')
                const currency = String(inv.currency ?? 'FCFA')
                const total = Number(inv.total ?? 0)
                const paid = Number(inv.amount_paid ?? 0)
                const remaining = total - paid
                const dueDate = inv.due_date
                  ? new Date(inv.due_date as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'
                const isOverdue = status === 'overdue'

                return (
                  <tr key={inv.id as string} className={`crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1|2|3|4}`}>
                    <td>
                      <Link href={`/invoices/${inv.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                        {String(inv.reference ?? '—')}
                      </Link>
                    </td>
                    <td className="text-muted-foreground text-xs">{String(inv.contact_id ?? '—')}</td>
                    <td>
                      <span className={`crm-pill crm-pill-${status}`}>
                        {STATUS_LABELS[status] ?? status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className={`text-xs flex items-center gap-1 ${isOverdue ? '' : 'text-muted-foreground'}`}
                        style={isOverdue ? { color: 'oklch(0.5 0.18 20)' } : {}}>
                        {isOverdue && <AlertCircle className="h-3 w-3" />}
                        {dueDate}
                      </span>
                    </td>
                    <td className="text-right font-semibold text-sm">{formatMoney(total, currency)}</td>
                    <td className="text-right hidden sm:table-cell">
                      <span className="text-xs" style={{ color: paid >= total ? 'oklch(0.42 0.14 145)' : 'var(--muted-foreground)' }}>
                        {formatMoney(paid, currency)}
                      </span>
                    </td>
                    <td>
                      <Link href={`/invoices/${inv.id}`} className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
