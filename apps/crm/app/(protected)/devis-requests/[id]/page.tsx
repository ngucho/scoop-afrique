import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading, Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { DevisRequestActions } from '@/components/devis-requests/DevisRequestActions'

export default async function DevisRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await crmGetServer<Record<string, unknown>>(`devis-requests/${id}`)
  const req = result?.data

  if (!req) notFound()

  const name = `${req.first_name ?? ''} ${req.last_name ?? ''}`.trim() || '—'

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Demande de devis — {name}
      </Heading>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <div>
          <span className="text-sm text-muted-foreground">Contact</span>
          <p>{name}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Email</span>
          <p>{String(req.email ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Téléphone</span>
          <p>{String(req.phone ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Service</span>
          <p>{String(req.service_slug ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Description</span>
          <p className="whitespace-pre-wrap">{String(req.description ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Date</span>
          <p>
            {req.created_at
              ? new Date(req.created_at as string).toLocaleString('fr-FR')
              : '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {!req.converted_to_devis_id && !req.converted_to_contact_id && !req.archived && (
          <>
            <Link href={`/contacts/new?devis_request_id=${id}`}>
              <Button>Créer un contact</Button>
            </Link>
            <Link href={`/devis/new?devis_request_id=${id}`}>
              <Button variant="outline">Créer un devis</Button>
            </Link>
            <DevisRequestActions id={id} variant="detail" />
          </>
        )}
      </div>
    </div>
  )
}
