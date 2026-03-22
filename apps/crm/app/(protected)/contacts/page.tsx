import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { Plus, User, Mail, Building2, Phone, ArrowUpDown } from 'lucide-react'
import { getCrmIsAdmin } from '@/lib/crm-admin'
import { AdminArchiveRestoreActions } from '@/components/admin/AdminArchiveRestoreActions'
import { ContactsListToolbar } from '@/components/contacts/ContactsListToolbar'
import { buildContactsQuery, sortToggleHref, type ContactsListParams } from '@/lib/crm-list-query'

const TYPE_COLORS: Record<string, string> = {
  prospect: 'crm-pill crm-pill-sent',
  client: 'crm-pill crm-pill-accepted',
  partner: 'crm-pill crm-pill-confirmed',
  influencer: 'crm-pill crm-pill-draft',
  sponsor: 'crm-pill crm-pill-partial',
  other: 'crm-pill crm-pill-draft',
}

function SortTh({
  label,
  column,
  base,
  className = '',
}: {
  label: string
  column: 'last_name' | 'email' | 'company' | 'created_at'
  base: ContactsListParams
  className?: string
}) {
  const active = base.sort === column
  const href = sortToggleHref(base, column)
  return (
    <th className={className}>
      <Link
        href={href}
        className="inline-flex items-center gap-1 font-medium hover:text-primary transition-colors"
      >
        {label}
        <ArrowUpDown
          className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-primary' : 'opacity-40'}`}
        />
        {active ? (
          <span className="sr-only">{base.order === 'asc' ? 'croissant' : 'décroissant'}</span>
        ) : null}
      </Link>
    </th>
  )
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const raw = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? v[0] : v
  }

  const listBase: ContactsListParams = {
    search: raw('search') || undefined,
    type: raw('type') || undefined,
    country: raw('country') || undefined,
    city: raw('city') || undefined,
    sort: raw('sort') || 'created_at',
    order: raw('order') || 'desc',
    limit: 100,
  }

  const isAdmin = await getCrmIsAdmin()

  const activeQ = buildContactsQuery(listBase)
  const archivedQ = buildContactsQuery({ ...listBase, archived: true })

  const activeRes = await crmGetServer<Array<Record<string, unknown>>>(`contacts?${activeQ}`)
  const activeContacts = activeRes?.data ?? []
  const activeTotal = activeRes?.total ?? activeContacts.length

  const archivedRes = isAdmin
    ? await crmGetServer<Array<Record<string, unknown>>>(`contacts?${archivedQ}`)
    : null
  const archivedContacts = archivedRes?.data ?? []
  const archivedTotal = archivedRes?.total ?? archivedContacts.length

  return (
    <div className="space-y-6 max-w-[1200px] crm-fade-in">
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Contacts</h1>
          <p className="crm-page-subtitle">
            {activeTotal} contact{activeTotal !== 1 ? 's' : ''} actif
            {isAdmin ? ` · ${archivedTotal} archivé${archivedTotal !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <Link href="/contacts/new">
          <Button className="flex items-center gap-2 rounded-full px-5 font-semibold">
            <Plus className="h-4 w-4" />
            Nouveau contact
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="crm-card p-4 text-muted-foreground text-sm">Chargement des filtres…</div>}>
        <ContactsListToolbar
          initialSearch={listBase.search ?? ''}
          initialType={listBase.type ?? ''}
          initialCountry={listBase.country ?? ''}
          initialCity={listBase.city ?? ''}
        />
      </Suspense>

      {activeContacts.length === 0 ? (
        <div className="crm-card">
          <div className="crm-empty py-16">
            <User className="crm-empty-icon h-12 w-12" />
            <p className="crm-empty-title">Aucun contact actif</p>
            <p className="text-sm text-muted-foreground">
              Ajustez les filtres ou ajoutez votre premier contact
            </p>
            <Link href="/contacts/new">
              <Button className="mt-4 rounded-full px-5">Créer un contact</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="crm-card overflow-hidden">
          <table className="crm-table">
            <thead>
              <tr>
                <SortTh label="Nom" column="last_name" base={listBase} />
                <SortTh label="Email" column="email" base={listBase} />
                <SortTh label="Entreprise" column="company" base={listBase} className="hidden md:table-cell" />
                <th className="hidden lg:table-cell">Téléphone</th>
                <th>Type</th>
                <th className="hidden sm:table-cell">Ville</th>
                <SortTh label="Créé" column="created_at" base={listBase} />
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {activeContacts.map((c, i) => {
                const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—'
                const initials =
                  name !== '—'
                    ? `${String(c.first_name ?? '').charAt(0)}${String(c.last_name ?? '').charAt(0)}`.toUpperCase()
                    : '?'
                const type = String(c.type ?? 'prospect')
                const isArchivedRow = Boolean((c as Record<string, unknown>)['is_archived'])
                return (
                  <tr key={c.id as string} className={`crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1 | 2 | 3 | 4}`}>
                    <td>
                      <Link href={`/contacts/${c.id}`} className="flex items-center gap-3 group">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 text-xs font-bold text-white"
                          style={{ background: 'var(--gradient-primary)' }}
                        >
                          {initials}
                        </div>
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {name}
                        </span>
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        <span className="text-xs">{String(c.email ?? '—')}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        <span className="text-xs">{String(c.company ?? '—')}</span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        <span className="text-xs">{String(c.phone ?? '—')}</span>
                      </div>
                    </td>
                    <td>
                      <span className={TYPE_COLORS[type] ?? 'crm-pill crm-pill-draft'}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell text-muted-foreground text-xs">
                      {String(c.city ?? c.country ?? '—')}
                    </td>
                    <td className="text-xs text-muted-foreground whitespace-nowrap">
                      {c.created_at
                        ? new Date(c.created_at as string).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td className="text-right">
                      <AdminArchiveRestoreActions
                        resource="contacts"
                        id={c.id as string}
                        isArchived={isArchivedRow}
                        isAdmin={isAdmin}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && archivedContacts.length > 0 && (
        <div className="crm-card overflow-hidden">
          <p className="crm-section-title px-4 pt-4 mb-3">Archivés ({archivedTotal})</p>
          <table className="crm-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th className="hidden md:table-cell">Entreprise</th>
                <th className="hidden lg:table-cell">Téléphone</th>
                <th>Type</th>
                <th className="hidden sm:table-cell">Ville</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {archivedContacts.map((c, i) => {
                const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—'
                const initials =
                  name !== '—'
                    ? `${String(c.first_name ?? '').charAt(0)}${String(c.last_name ?? '').charAt(0)}`.toUpperCase()
                    : '?'
                const type = String(c.type ?? 'prospect')
                const isArchivedRow = Boolean((c as Record<string, unknown>)['is_archived'])
                return (
                  <tr key={c.id as string} className={`crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1 | 2 | 3 | 4}`}>
                    <td>
                      <Link href={`/contacts/${c.id}`} className="flex items-center gap-3 group">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 text-xs font-bold text-white"
                          style={{ background: 'var(--gradient-primary)' }}
                        >
                          {initials}
                        </div>
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {name}
                        </span>
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        <span className="text-xs">{String(c.email ?? '—')}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        <span className="text-xs">{String(c.company ?? '—')}</span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        <span className="text-xs">{String(c.phone ?? '—')}</span>
                      </div>
                    </td>
                    <td>
                      <span className={TYPE_COLORS[type] ?? 'crm-pill crm-pill-draft'}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell text-muted-foreground text-xs">
                      {String(c.city ?? c.country ?? '—')}
                    </td>
                    <td className="text-right">
                      <AdminArchiveRestoreActions
                        resource="contacts"
                        id={c.id as string}
                        isArchived={isArchivedRow}
                        isAdmin={isAdmin}
                      />
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
