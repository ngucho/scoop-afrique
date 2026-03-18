import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading, Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { DevisActions } from '@/components/devis/DevisActions'
import { getCrmIsAdmin } from '@/lib/crm-admin'
import { AdminArchiveRestoreActions } from '@/components/admin/AdminArchiveRestoreActions'
import { ActivityClient } from '@/components/activity/ActivityClient'

export default async function DevisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [result, activityRes] = await Promise.all([
    crmGetServer<Record<string, unknown>>(`devis/${id}`),
    crmGetServer<Array<Record<string, unknown>>>(`activity/devis/${id}?limit=50`),
  ])
  const devis = result?.data
  const activity = activityRes?.data ?? []

  if (!devis) notFound()

  const isAdmin = await getCrmIsAdmin()
  const isArchived = Boolean((devis as Record<string, unknown>)['is_archived'])

  const contact = devis.crm_contacts as Record<string, unknown> | null
  const project = devis.crm_projects as Record<string, unknown> | null
  const contactName = contact
    ? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()
    : '—'
  const lineItems = (devis.line_items as Array<Record<string, unknown>>) ?? []

  const formatDate = (d: unknown) =>
    d ? new Date(d as string).toLocaleDateString('fr-FR') : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          {devis.reference as string} — {devis.title as string}
        </Heading>
        <div className="flex items-center gap-2">
          <DevisActions devisId={id} status={devis.status as string} />
          <AdminArchiveRestoreActions
            resource="devis"
            id={id}
            isArchived={isArchived}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Link href={`/devis/${id}/edit`}>
          <Button variant="outline">Modifier</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {contact && (
          <div className="rounded-lg border border-border p-6">
            <h2 className="font-semibold mb-4 text-base">Client</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{contactName}</p>
              {(contact.company as string) && (
                <p className="text-muted-foreground">{String(contact.company)}</p>
              )}
              {(contact.email as string) && (
                <p>
                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                    {String(contact.email)}
                  </a>
                </p>
              )}
              {(contact.phone as string) && (
                <p>
                  <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                    {String(contact.phone)}
                  </a>
                </p>
              )}
              {(contact.whatsapp as string) && (
                <p>
                  <a
                    href={`https://wa.me/${String(contact.whatsapp).replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    WhatsApp: {String(contact.whatsapp)}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}
        {project && (
          <div className="rounded-lg border border-border p-6">
            <h2 className="font-semibold mb-4 text-base">Projet</h2>
            <div className="space-y-2 text-sm">
              {(project.reference as string) && (
                <p className="font-medium">{String(project.reference)}</p>
              )}
              {(project.title as string) && (
                <p>{String(project.title)}</p>
              )}
              {(project.description as string) && (
                <p className="text-muted-foreground line-clamp-3">{String(project.description)}</p>
              )}
              {(project.start_date != null || project.end_date != null) ? (
                <p className="text-muted-foreground pt-1">
                  {formatDate(project.start_date)} — {formatDate(project.end_date)}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
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

      <div className="space-y-2">
        <p className="crm-section-title mb-0">Journal d&apos;activité</p>
        <ActivityClient initialActivity={activity} />
      </div>
    </div>
  )
}
