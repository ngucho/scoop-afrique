import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { InvoiceActions } from '@/components/invoices/InvoiceActions'
import { PaymentForm } from '@/components/invoices/PaymentForm'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [invoiceRes, paymentsRes] = await Promise.all([
    crmGetServer<Record<string, unknown>>(`invoices/${id}`),
    crmGetServer<Array<Record<string, unknown>>>(`invoices/${id}/payments`),
  ])
  const invoice = invoiceRes?.data
  const payments = paymentsRes?.data ?? []

  if (!invoice) notFound()

  const lineItems = (invoice.line_items as Array<Record<string, unknown>>) ?? []
  const total = (invoice.total as number) ?? 0
  const amountPaid = (invoice.amount_paid as number) ?? 0
  const balance = total - amountPaid

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          {invoice.reference as string}
        </Heading>
        <InvoiceActions invoiceId={id} status={invoice.status as string} />
      </div>

      <div className="flex gap-4">
        <Link href={`/invoices/${id}/edit`}>
          <span className="text-sm text-primary hover:underline">Modifier</span>
        </Link>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <div>
          <span className="text-sm text-muted-foreground">Statut</span>
          <p className="capitalize">{String(invoice.status ?? '—')}</p>
        </div>

        <div className="pt-4">
          <span className="text-sm text-muted-foreground">Lignes</span>
          <table className="w-full mt-2 text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Qté</th>
                <th className="text-right py-2">Prix unit.</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-2">{String(item.description ?? '—')}</td>
                  <td className="text-right py-2">{String(item.quantity ?? '—')}</td>
                  <td className="text-right py-2">
                    {((item.unit_price as number) ?? 0).toLocaleString('fr-FR')} {String(item.unit ?? '')}
                  </td>
                  <td className="text-right py-2">
                    {((item.total as number) ?? 0).toLocaleString('fr-FR')} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 flex justify-end">
          <div className="text-right space-y-1">
            <div className="flex justify-between gap-8 font-semibold">
              <span>Total</span>
              <span>{total.toLocaleString('fr-FR')} {String(invoice.currency ?? 'FCFA')}</span>
            </div>
            <div className="flex justify-between gap-8 text-muted-foreground">
              <span>Payé</span>
              <span>{amountPaid.toLocaleString('fr-FR')} FCFA</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between gap-8 font-medium text-destructive">
                <span>Reste</span>
                <span>{balance.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
          </div>
        </div>

        {invoice.notes ? (
          <div>
            <span className="text-sm text-muted-foreground">Notes</span>
            <p className="whitespace-pre-wrap">{String(invoice.notes)}</p>
          </div>
        ) : null}
      </div>

      <section>
        <h2 className="font-semibold mb-3">Paiements</h2>
        {payments.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Méthode</th>
                  <th className="text-right p-3">Montant</th>
                  <th className="text-left p-3">Reçu</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id as string} className="border-t border-border">
                    <td className="p-3">
                      {p.paid_at
                        ? new Date(p.paid_at as string).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td className="p-3 capitalize">{String(p.method ?? '—').replace('_', ' ')}</td>
                    <td className="p-3 text-right">
                      {((p.amount as number) ?? 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-3">
                      <a
                        href={`/api/crm/payments/${p.id}/receipt/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {balance > 0 && (
          <PaymentForm invoiceId={id} onSuccess={() => {}} />
        )}
      </section>
    </div>
  )
}
