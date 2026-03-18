import Link from 'next/link'
import { crmGetServer } from '@/lib/api-server'
import { Inbox, ArrowRight, Clock, Mail, Package } from 'lucide-react'
import { DevisRequestActions } from '@/components/devis-requests/DevisRequestActions'
import { getCrmIsAdmin } from '@/lib/crm-admin'

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / 3600000)
  if (diffH < 1) return "Il y a moins d'1h"
  if (diffH < 24) return `Il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `Il y a ${diffD}j`
}

export default async function DevisRequestsPage() {
  const result = await crmGetServer<Array<Record<string, unknown>>>('devis-requests?limit=100')
  const requests = result?.data ?? []

  const isAdmin = await getCrmIsAdmin()

  const pending = requests.filter(
    (r) => !r.converted_to_devis_id && !r.converted_to_contact_id && !r.archived
  )
  const converted = requests.filter(
    (r) => r.converted_to_devis_id || r.converted_to_contact_id || r.archived
  )

  return (
    <div className="space-y-6 max-w-[1000px] crm-fade-in">
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Demandes de devis</h1>
          <p className="crm-page-subtitle">
            {pending.length} en attente · {converted.length} traité{converted.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl relative"
          style={{ background: 'var(--primary-subtle)' }}
        >
          <Inbox className="h-5 w-5" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
          {pending.length > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
              style={{ background: 'var(--primary)' }}
            >
              {pending.length}
            </span>
          )}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="crm-card">
          <div className="crm-empty py-16">
            <Inbox className="crm-empty-icon h-12 w-12" />
            <p className="crm-empty-title">Aucune demande</p>
            <p className="text-sm text-muted-foreground">Les demandes du site landing page apparaîtront ici</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <p className="crm-section-title mb-3">À traiter ({pending.length})</p>
              <div className="space-y-2">
                {pending.map((r, i) => {
                  const name = `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '—'
                  const initials = name !== '—'
                    ? `${String(r.first_name ?? '').charAt(0)}${String(r.last_name ?? '').charAt(0)}`.toUpperCase()
                    : '?'
                  return (
                    <div
                      key={r.id as string}
                      className={`crm-card crm-card-interactive flex items-center gap-4 p-4 group crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1 | 2 | 3 | 4}`}
                    >
                      <Link href={`/devis-requests/${r.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full shrink-0 font-bold text-sm text-white"
                          style={{ background: 'var(--gradient-primary)' }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm">{name}</span>
                            <span
                              className="crm-pill text-[10px]"
                              style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
                            >
                              Nouveau
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {String(r.email ?? '—')}
                            </span>
                            {r.service_slug != null && String(r.service_slug) !== '' ? (
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {String(r.service_slug)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {r.created_at ? timeAgo(String(r.created_at)) : '—'}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                      <div className="shrink-0">
                        <DevisRequestActions id={r.id as string} variant="card" isAdmin={isAdmin} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {converted.length > 0 && (
            <div>
              <p className="crm-section-title mb-3">Traités ({converted.length})</p>
              <div className="crm-card overflow-hidden">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Contact</th>
                      <th className="hidden md:table-cell">Service</th>
                      <th className="hidden sm:table-cell">Date</th>
                      <th>Converti</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {converted.map((r) => (
                      <tr key={r.id as string}>
                        <td>
                          <div>
                            <span className="font-medium text-sm">
                              {`${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '—'}
                            </span>
                            <p className="text-xs text-muted-foreground">{String(r.email ?? '')}</p>
                          </div>
                        </td>
                        <td className="hidden md:table-cell text-xs text-muted-foreground">
                          {String(r.service_slug ?? '—')}
                        </td>
                        <td className="hidden sm:table-cell text-xs text-muted-foreground">
                          {r.created_at ? new Date(r.created_at as string).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td>
                          <span className="crm-pill crm-pill-accepted">
                            {r.converted_to_devis_id
                              ? 'Devis créé'
                              : r.converted_to_contact_id
                                ? 'Contact créé'
                                : r.archived
                                  ? 'Archivé'
                                  : '—'}
                          </span>
                        </td>
                        <td>
                          <Link href={`/devis-requests/${r.id}`} className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
