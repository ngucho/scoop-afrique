'use client'

import { Avatar } from 'scoop'
import { Bell, Search, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: 'Tableau de bord',
  contacts: 'Contacts',
  organizations: 'Organisations',
  services: 'Prestations',
  'devis-requests': 'Demandes devis',
  devis: 'Devis',
  projects: 'Projets',
  invoices: 'Factures',
  contracts: 'Contrats',
  reminders: 'Relances',
  reports: 'Rapports',
  activity: 'Activité',
  settings: 'Paramètres',
  new: 'Nouveau',
  edit: 'Modifier',
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {segments.map((seg, i) => {
        const label = BREADCRUMB_MAP[seg] ?? seg
        const isLast = i === segments.length - 1
        const href = '/' + segments.slice(0, i + 1).join('/')

        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/40">/</span>}
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export function CrmHeader({
  userEmail,
  userName,
  userAvatar,
  onMenuClick,
}: {
  userEmail?: string
  userName?: string
  userAvatar?: string
  onMenuClick?: () => void
}) {
  return (
    <header
      className="flex h-[60px] items-center justify-between border-b border-border px-5 shrink-0"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 rounded-md hover:bg-muted transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        {/* Search placeholder */}
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors hidden md:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Rechercher…</span>
          <kbd className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-background border border-border font-mono">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 rounded-full hover:bg-muted transition-colors"
        >
          <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border ml-1">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium leading-none text-foreground">
              {userName?.split(' ')[0] || 'Utilisateur'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
              {userEmail || ''}
            </p>
          </div>
          <Avatar
            src={userAvatar}
            alt={userName || userEmail || ''}
            fallback={(userName || userEmail || 'U').charAt(0).toUpperCase()}
            size="sm"
          />
        </div>
      </div>
    </header>
  )
}
