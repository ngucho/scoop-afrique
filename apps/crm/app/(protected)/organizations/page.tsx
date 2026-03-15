import Link from 'next/link'
import { Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { Plus, Building2, Globe, Mail, ArrowRight } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  media: 'Média',
  brand: 'Marque',
  agency: 'Agence',
  ngo: 'ONG',
  startup: 'Startup',
  institution: 'Institution',
  other: 'Autre',
}

const TYPE_COLORS: Record<string, string> = {
  media: 'crm-pill crm-pill-sent',
  brand: 'crm-pill crm-pill-accepted',
  agency: 'crm-pill crm-pill-confirmed',
  ngo: 'crm-pill crm-pill-partial',
  startup: 'crm-pill crm-pill-in_progress',
  institution: 'crm-pill crm-pill-draft',
  other: 'crm-pill crm-pill-draft',
}

export default async function OrganizationsPage() {
  const result = await crmGetServer<Array<Record<string, unknown>>>('organizations?limit=100')
  const orgs = result?.data ?? []

  return (
    <div className="space-y-6 max-w-[1200px] crm-fade-in">
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Organisations</h1>
          <p className="crm-page-subtitle">{orgs.length} organisation{orgs.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/organizations/new">
          <Button className="flex items-center gap-2 rounded-full px-5 font-semibold">
            <Plus className="h-4 w-4" />
            Nouvelle organisation
          </Button>
        </Link>
      </div>

      {orgs.length === 0 ? (
        <div className="crm-card">
          <div className="crm-empty py-16">
            <Building2 className="crm-empty-icon h-12 w-12" />
            <p className="crm-empty-title">Aucune organisation</p>
            <p className="text-sm text-muted-foreground">Ajoutez vos entreprises clientes ou partenaires</p>
            <Link href="/organizations/new">
              <Button className="mt-4 rounded-full px-5">Créer une organisation</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((o, i) => {
            const type = String(o.type ?? 'other')
            return (
              <Link
                key={o.id as string}
                href={`/organizations/${o.id}`}
                className={`crm-card crm-card-interactive p-5 block group crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1|2|3|4}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                    style={{ background: 'var(--primary-subtle)' }}
                  >
                    <Building2 className="h-5 w-5" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {String(o.name ?? '—')}
                    </h3>
                    <span className={`${TYPE_COLORS[type] ?? 'crm-pill crm-pill-draft'} mt-1`}>
                      {TYPE_LABELS[type] ?? type}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>

                <div className="space-y-1 pt-3 border-t border-border">
                  {o.email != null && String(o.email) !== '' ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{String(o.email)}</span>
                    </div>
                  ) : null}
                  {o.website != null && String(o.website) !== '' ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate">{String(o.website).replace(/^https?:\/\//, '')}</span>
                    </div>
                  ) : null}
                  {o.country != null && String(o.country) !== '' ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="shrink-0">📍</span>
                      <span>{String(o.country)}{o.address ? ` · ${String(o.address)}` : ''}</span>
                    </div>
                  ) : null}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
