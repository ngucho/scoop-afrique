import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { Plus, Building2, Globe, Mail, Phone, ArrowUpDown } from 'lucide-react'
import { OrganizationsListToolbar } from '@/components/organizations/OrganizationsListToolbar'
import { buildOrganizationsQuery, orgSortToggleHref, type OrganizationsListParams } from '@/lib/crm-list-query'

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

function SortTh({
  label,
  column,
  base,
  className = '',
}: {
  label: string
  column: 'name' | 'created_at'
  base: OrganizationsListParams
  className?: string
}) {
  const active = base.sort === column
  const href = orgSortToggleHref(base, column)
  return (
    <th className={className}>
      <Link
        href={href}
        className="inline-flex items-center gap-1 font-medium hover:text-primary transition-colors"
      >
        {label}
        <ArrowUpDown className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-primary' : 'opacity-40'}`} />
      </Link>
    </th>
  )
}

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const raw = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? v[0] : v
  }

  const listBase: OrganizationsListParams = {
    search: raw('search') || undefined,
    type: raw('type') || undefined,
    country: raw('country') || undefined,
    sort: raw('sort') || 'name',
    order: raw('order') || 'asc',
    limit: 100,
  }

  const q = buildOrganizationsQuery(listBase)
  const result = await crmGetServer<Array<Record<string, unknown>>>(`organizations?${q}`)
  const orgs = result?.data ?? []
  const total = result?.total ?? orgs.length

  return (
    <div className="space-y-6 max-w-[1200px] crm-fade-in">
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Organisations</h1>
          <p className="crm-page-subtitle">
            {total} organisation{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/organizations/new">
          <Button className="flex items-center gap-2 rounded-full px-5 font-semibold">
            <Plus className="h-4 w-4" />
            Nouvelle organisation
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="crm-card p-4 text-muted-foreground text-sm">Chargement des filtres…</div>}>
        <OrganizationsListToolbar
          initialSearch={listBase.search ?? ''}
          initialType={listBase.type ?? ''}
          initialCountry={listBase.country ?? ''}
        />
      </Suspense>

      {orgs.length === 0 ? (
        <div className="crm-card">
          <div className="crm-empty py-16">
            <Building2 className="crm-empty-icon h-12 w-12" />
            <p className="crm-empty-title">Aucune organisation</p>
            <p className="text-sm text-muted-foreground">Modifiez les filtres ou créez une organisation</p>
            <Link href="/organizations/new">
              <Button className="mt-4 rounded-full px-5">Créer une organisation</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="crm-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr>
                  <SortTh label="Nom" column="name" base={listBase} />
                  <th className="hidden md:table-cell">Type</th>
                  <th className="hidden lg:table-cell">Email</th>
                  <th className="hidden lg:table-cell">Site / Tél.</th>
                  <th className="hidden sm:table-cell">Pays</th>
                  <SortTh label="Créée" column="created_at" base={listBase} className="whitespace-nowrap" />
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {orgs.map((o, i) => {
                  const type = String(o.type ?? 'other')
                  return (
                    <tr
                      key={o.id as string}
                      className={`crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1 | 2 | 3 | 4}`}
                    >
                      <td>
                        <Link
                          href={`/organizations/${o.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {String(o.name ?? '—')}
                        </Link>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className={TYPE_COLORS[type] ?? 'crm-pill crm-pill-draft'}>
                          {TYPE_LABELS[type] ?? type}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell text-xs text-muted-foreground">
                        {o.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            {String(o.email)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="hidden lg:table-cell text-xs text-muted-foreground">
                        <div className="space-y-0.5">
                          {o.website ? (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <Globe className="h-3 w-3 shrink-0" />
                              {String(o.website).replace(/^https?:\/\//, '')}
                            </span>
                          ) : null}
                          {o.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 shrink-0" />
                              {String(o.phone)}
                            </span>
                          ) : null}
                          {!o.website && !o.phone ? '—' : null}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell text-xs text-muted-foreground">
                        {String(o.country ?? '—')}
                      </td>
                      <td className="text-xs text-muted-foreground whitespace-nowrap">
                        {o.created_at
                          ? new Date(o.created_at as string).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td>
                        <Link
                          href={`/organizations/${o.id}`}
                          className="text-xs text-primary hover:underline whitespace-nowrap"
                        >
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
