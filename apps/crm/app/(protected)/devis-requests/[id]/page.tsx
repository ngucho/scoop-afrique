import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading, Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { DevisRequestActions } from '@/components/devis-requests/DevisRequestActions'
import { getCrmIsAdmin } from '@/lib/crm-admin'
import { ExternalLink } from 'lucide-react'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="mt-0.5">{value}</p>
    </div>
  )
}

function fmtBudget(min?: number | null, max?: number | null, currency?: string | null) {
  const c = currency ?? 'FCFA'
  if (min && max) return `${min.toLocaleString('fr-FR')} — ${max.toLocaleString('fr-FR')} ${c}`
  if (min) return `À partir de ${min.toLocaleString('fr-FR')} ${c}`
  if (max) return `Jusqu'à ${max.toLocaleString('fr-FR')} ${c}`
  return null
}

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
  const isAdmin = await getCrmIsAdmin()
  const budget = fmtBudget(
    req.budget_min as number | null,
    req.budget_max as number | null,
    req.budget_currency as string | null
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <Heading as="h1" level="h1">
          Demande de devis — {name}
        </Heading>
        {Boolean(
          req.archived || req.converted_to_devis_id || req.converted_to_contact_id || req.converted_to_project_id
        ) && (
          <div className="flex flex-wrap gap-1.5 shrink-0 mt-1">
            {Boolean(req.converted_to_devis_id) && (
              <Link href={`/devis/${String(req.converted_to_devis_id)}`} className="crm-pill crm-pill-accepted text-xs hover:opacity-80">
                Devis créé →
              </Link>
            )}
            {Boolean(req.converted_to_contact_id) && (
              <Link href={`/contacts/${String(req.converted_to_contact_id)}`} className="crm-pill crm-pill-sent text-xs hover:opacity-80">
                Contact créé →
              </Link>
            )}
            {Boolean(req.converted_to_project_id) && (
              <Link href={`/projects/${String(req.converted_to_project_id)}`} className="crm-pill text-xs hover:opacity-80" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                Projet →
              </Link>
            )}
            {Boolean(req.archived) &&
              !req.converted_to_devis_id &&
              !req.converted_to_contact_id &&
              !req.converted_to_project_id && (
              <span className="crm-pill crm-pill-draft text-xs">Archivé</span>
            )}
          </div>
        )}
      </div>

      {/* Informations du prospect */}
      <div className="crm-card p-6 space-y-4">
        <h2 className="font-semibold text-sm text-foreground mb-1">Informations du prospect</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="Nom complet" value={name} />
          <InfoRow label="Société" value={req.company ? String(req.company) : null} />
          <InfoRow label="Email" value={req.email ? String(req.email) : null} />
          <InfoRow label="Téléphone" value={req.phone ? String(req.phone) : null} />
        </div>

        <div className="border-t border-border pt-4 grid gap-4 sm:grid-cols-2">
          <InfoRow label="Service demandé" value={req.service_slug ? String(req.service_slug) : null} />
          {budget && <InfoRow label="Budget estimé" value={budget} />}
          <InfoRow label="Date souhaitée" value={
            req.preferred_date
              ? new Date(String(req.preferred_date)).toLocaleDateString('fr-FR')
              : null
          } />
          <InfoRow label="Délai" value={req.deadline ? String(req.deadline) : null} />
        </div>

        <div className="border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Description du besoin</span>
          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">
            {String(req.description ?? '—')}
          </p>
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Reçu le{' '}
            {req.created_at
              ? new Date(req.created_at as string).toLocaleString('fr-FR')
              : '—'}
          </span>
          {Boolean(req.source_url) && (
            <a
              href={req.source_url as string}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Page source
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        {!req.converted_to_devis_id && !req.converted_to_contact_id && !Boolean(req.archived) && (
          <>
            <Link href={`/contacts/new?devis_request_id=${id}`}>
              <Button>Créer un contact</Button>
            </Link>
            <Link href={`/devis/new?devis_request_id=${id}`}>
              <Button variant="outline">Créer un devis</Button>
            </Link>
          </>
        )}
        <DevisRequestActions
          id={id}
          variant="detail"
          isAdmin={isAdmin}
          archived={Boolean(req.archived)}
          convertedToDevisId={(req.converted_to_devis_id as string) ?? null}
          convertedToContactId={(req.converted_to_contact_id as string) ?? null}
        />
      </div>
    </div>
  )
}
