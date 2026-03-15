import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading, Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { DevisActions } from '@/components/devis/DevisActions'

export default async function DevisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await crmGetServer<Record<string, unknown>>(`devis/${id}`)
  const devis = result?.data

  if (!devis) notFound()

  const contact = devis.crm_contacts as Record<string, unknown> | null
  const contactName = contact
    ? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()
    : '—'
  const lineItems = (devis.line_items as Array<Record<string, unknown>>) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          {devis.reference as string} — {devis.title as string}
        </Heading>
        <DevisActions devisId={id} status={devis.status as string} />
      </div>

      <div className="flex gap-4">
        <Link href={`/devis/${id}/edit`}>
          <Button variant="outline">Modifier</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <div>
          <span className="text-sm text-muted-foreground">Contact</span>
          <p>{contactName}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Statut</span>
          <p className="capitalize">{String(devis.status ?? '—')}</p>
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
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{((devis.subtotal as number) ?? 0).toLocaleString('fr-FR')} FCFA</span>
            </div>
            {(devis.tax_rate as number) > 0 && (
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">TVA ({(devis.tax_rate as number)}%)</span>
                <span>{((devis.tax_amount as number) ?? 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div className="flex justify-between gap-8 font-semibold pt-2">
              <span>Total</span>
              <span>{((devis.total as number) ?? 0).toLocaleString('fr-FR')} {String(devis.currency ?? 'FCFA')}</span>
            </div>
          </div>
        </div>

        {devis.notes ? (
          <div>
            <span className="text-sm text-muted-foreground">Notes</span>
            <p className="whitespace-pre-wrap">{String(devis.notes)}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
