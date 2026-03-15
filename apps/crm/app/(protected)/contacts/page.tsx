import Link from 'next/link'
import { Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { Plus, User, Mail, Building2, Phone, Search } from 'lucide-react'

const TYPE_COLORS: Record<string, string> = {
  prospect: 'crm-pill crm-pill-sent',
  client: 'crm-pill crm-pill-accepted',
  partner: 'crm-pill crm-pill-confirmed',
  influencer: 'crm-pill crm-pill-draft',
  supplier: 'crm-pill crm-pill-partial',
}

export default async function ContactsPage() {
  const result = await crmGetServer<Array<Record<string, unknown>>>('contacts?limit=100')
  const contacts = result?.data ?? []
  const total = result?.total ?? contacts.length

  return (
    <div className="space-y-6 max-w-[1200px] crm-fade-in">
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Contacts</h1>
          <p className="crm-page-subtitle">{total} contact{total !== 1 ? 's' : ''} au total</p>
        </div>
        <Link href="/contacts/new">
          <Button className="flex items-center gap-2 rounded-full px-5 font-semibold">
            <Plus className="h-4 w-4" />
            Nouveau contact
          </Button>
        </Link>
      </div>

      {contacts.length === 0 ? (
        <div className="crm-card">
          <div className="crm-empty py-16">
            <User className="crm-empty-icon h-12 w-12" />
            <p className="crm-empty-title">Aucun contact</p>
            <p className="text-sm text-muted-foreground">Commencez par ajouter votre premier contact</p>
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
                <th>Nom</th>
                <th>Email</th>
                <th className="hidden md:table-cell">Entreprise</th>
                <th className="hidden lg:table-cell">Téléphone</th>
                <th>Type</th>
                <th className="hidden sm:table-cell">Ville</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, i) => {
                const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—'
                const initials = name !== '—'
                  ? `${String(c.first_name ?? '').charAt(0)}${String(c.last_name ?? '').charAt(0)}`.toUpperCase()
                  : '?'
                const type = String(c.type ?? 'prospect')
                return (
                  <tr key={c.id as string} className={`crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1|2|3|4}`}>
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
