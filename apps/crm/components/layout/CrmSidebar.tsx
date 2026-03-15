'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from 'scoop'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ClipboardList,
  Receipt,
  FileSignature,
  Bell,
  LogOut,
  BarChart3,
  Activity,
  Settings,
  Package,
  ChevronRight,
  Inbox,
  TrendingUp,
} from 'lucide-react'

const CRM_NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/reports', label: 'Rapports', icon: TrendingUp },
      { href: '/activity', label: 'Activité', icon: Activity },
    ],
  },
  {
    label: 'Clients & Partenaires',
    items: [
      { href: '/contacts', label: 'Contacts', icon: Users },
      { href: '/organizations', label: 'Organisations', icon: Building2 },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { href: '/devis-requests', label: 'Demandes devis', icon: Inbox },
      { href: '/devis', label: 'Devis', icon: FileText },
      { href: '/projects', label: 'Projets', icon: ClipboardList },
      { href: '/services', label: 'Prestations', icon: Package },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/invoices', label: 'Factures', icon: Receipt },
      { href: '/contracts', label: 'Contrats', icon: FileSignature },
      { href: '/reminders', label: 'Relances', icon: Bell },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/settings', label: 'Paramètres', icon: Settings },
    ],
  },
]

export function CrmSidebar({
  onMenuClick,
}: {
  onMenuClick?: () => void
}) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo / Brand */}
      <div className="flex h-[60px] items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
        <Logo
          href="/dashboard"
          src="/icon.svg"
          size="sm"
          className="h-8 w-auto"
        />
        <div className="min-w-0">
          <p className="font-bold text-sm text-foreground leading-none tracking-tight">Scoop CRM</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Scoop Afrique</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {CRM_NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="crm-section-title mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`crm-nav-item group ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                    <span className="flex-1 text-[13px]">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        <Link
          href="/auth/logout"
          className="crm-nav-item text-destructive hover:text-destructive"
          style={{ color: 'var(--destructive)' }}
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span className="text-[13px]">Déconnexion</span>
        </Link>
      </div>
    </aside>
  )
}
