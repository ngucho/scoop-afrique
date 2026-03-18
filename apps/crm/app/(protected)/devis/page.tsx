import Link from 'next/link'
import { Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { Plus, FileText, ArrowRight, Clock } from 'lucide-react'
import { getCrmIsAdmin } from '@/lib/crm-admin'
import { AdminArchiveRestoreActions } from '@/components/admin/AdminArchiveRestoreActions'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
}

function formatMoney(amount: number, currency = 'FCFA'): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

export default async function DevisPage() {
  const isAdmin = await getCrmIsAdmin()

  const activeRes = await crmGetServer<Array<Record<string, unknown>>>('devis?limit=100')
  if (!activeRes) {
    return (
      <div className="space-y-6 max-w-[1200px] crm-fade-in">
        <div className="crm-card p-6">
          <p className="text-sm font-semibold text-destructive">Erreur lors du chargement des devis</p>
          <p className="text-xs text-muted-foreground mt-1">
            Vérifiez la configuration backend et la structure de la base (soft-delete).
          </p>
        </div>
      </div>
    )
  }
  const devis = activeRes.data ?? []

  const archivedRes = isAdmin
    ? await crmGetServer<Array<Record<string, unknown>>>('devis?limit=100&archived=true')
    : null
  const archivedDevis = archivedRes?.data ?? []

  const pipeline = devis.filter((d) => d.status === 'sent').reduce((sum, d) => sum + Number(d.total ?? 0), 0)
  const accepted = devis.filter((d) => d.status === 'accepted').length
  const conversion = devis.filter((d) => d.status === 'sent').length > 0
    ? Math.round((accepted / (devis.filter((d) => d.status === 'sent').length + accepted)) * 100)
    : 0

  return (
    <div className="space-y-6 max-w-[1200px] crm-fade-in">
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Devis</h1>
          <p className="crm-page-subtitle">
            {devis.length} devis actifs
            {isAdmin ? ` · ${archivedDevis.length} archivé${archivedDevis.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/devis-requests" className="crm-quick-action text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">Demandes</span>
          </Link>
          <Link href="/devis/new">
            <Button className="flex items-center gap-2 rounded-full px-5 font-semibold">
              <Plus className="h-4 w-4" />
              Nouveau devis
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {devis.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pipeline (envoyés)', value: formatMoney(pipeline), color: 'oklch(0.42 0.16 260)' },
            { label: 'Acceptés', value: accepted, color: 'oklch(0.42 0.14 145)' },
            { label: 'Taux de conversion', value: `${conversion}%`, color: 'var(--primary)' },
          ].map((s) => (
            <div key={s.label} className="crm-card p-4 crm-fade-in">
              <p className="text-xl font-bold tracking-tight truncate" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {devis.length === 0 ? (
        <div className="crm-card">
          <div className="crm-empty py-16">
            <FileText className="crm-empty-icon h-12 w-12" />
            <p className="crm-empty-title">Aucun devis</p>
            <p className="text-sm text-muted-foreground">Créez votre premier devis</p>
            <Link href="/devis/new">
              <Button className="mt-4 rounded-full px-5">Créer un devis</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="crm-card overflow-hidden">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Titre</th>
                <th>Statut</th>
                <th className="hidden md:table-cell">Validité</th>
                <th className="text-right">Total TTC</th>
                <th className="w-8" />
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {devis.map((d, i) => {
                const status = String(d.status ?? 'draft')
                const currency = String(d.currency ?? 'FCFA')
                const validUntil = d.valid_until
                  ? new Date(d.valid_until as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'

                return (
                  <tr key={d.id as string} className={`crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1|2|3|4}`}>
                    <td>
                      <Link href={`/devis/${d.id}`} className="font-semibold text-foreground hover:text-primary transition-colors font-mono text-xs">
                        {String(d.reference ?? '—')}
                      </Link>
                    </td>
                    <td>
                      <span className="text-sm font-medium">{String(d.title ?? '—')}</span>
                    </td>
                    <td>
                      <span className={`crm-pill crm-pill-${status}`}>
                        {STATUS_LABELS[status] ?? status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell text-xs text-muted-foreground">{validUntil}</td>
                    <td className="text-right font-bold text-sm">{formatMoney(Number(d.total ?? 0), currency)}</td>
                    <td>
                      <AdminArchiveRestoreActions
                        resource="devis"
                        id={d.id as string}
                        isArchived={Boolean((d as Record<string, unknown>)['is_archived'])}
                        isAdmin={isAdmin}
                      />
                    </td>
                    <td>
                      <Link href={`/devis/${d.id}`} className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground transition-colors">
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

      {isAdmin && archivedDevis.length > 0 && (
        <div className="crm-card overflow-hidden">
          <p className="crm-section-title px-4 pt-4 mb-3">Archivés ({archivedDevis.length})</p>
          <table className="crm-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Titre</th>
                <th>Statut</th>
                <th className="hidden md:table-cell">Validité</th>
                <th className="text-right">Total TTC</th>
                <th className="w-8" />
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {archivedDevis.map((d, i) => {
                const status = String(d.status ?? 'draft')
                const currency = String(d.currency ?? 'FCFA')
                const validUntil = d.valid_until
                  ? new Date(d.valid_until as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'

                return (
                  <tr key={d.id as string} className={`crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1|2|3|4}`}>
                    <td>
                      <Link href={`/devis/${d.id}`} className="font-semibold text-foreground hover:text-primary transition-colors font-mono text-xs">
                        {String(d.reference ?? '—')}
                      </Link>
                    </td>
                    <td>
                      <span className="text-sm font-medium">{String(d.title ?? '—')}</span>
                    </td>
                    <td>
                      <span className={`crm-pill crm-pill-${status}`}>
                        {STATUS_LABELS[status] ?? status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell text-xs text-muted-foreground">{validUntil}</td>
                    <td className="text-right font-bold text-sm">{formatMoney(Number(d.total ?? 0), currency)}</td>
                    <td>
                      <AdminArchiveRestoreActions
                        resource="devis"
                        id={d.id as string}
                        isArchived={Boolean((d as Record<string, unknown>)['is_archived'])}
                        isAdmin={isAdmin}
                      />
                    </td>
                    <td>
                      <Link href={`/devis/${d.id}`} className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground transition-colors">
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
