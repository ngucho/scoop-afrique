'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Dot, Avatar, Badge, ThemeToggle } from 'scoop'
import {
  IconLayoutDashboard,
  IconFileText,
  IconMessages,
  IconPhoto,
  IconTag,
  IconUsers,
  IconShield,
  IconSettings,
  IconLogout,
  IconExternalLink,
  IconMenu,
  IconX,
  IconChevronDown,
  IconUser,
} from '@tabler/icons-react'
import { type AppRole, getVisibleNav, ROLE_LABELS, ROLE_COLORS } from '@/lib/admin/rbac'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard: IconLayoutDashboard,
  FileText: IconFileText,
  MessageSquare: IconMessages,
  Image: IconPhoto,
  Tags: IconTag,
  Users: IconUsers,
  Shield: IconShield,
  Settings: IconSettings,
}

export function AdminLayoutClient({
  userEmail,
  userName,
  userAvatar,
  userRole,
  children,
}: {
  userEmail?: string
  userName?: string
  userAvatar?: string
  userRole: AppRole
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navItems = getVisibleNav(userRole)

  // Mobile swipe: detect left swipe to close sidebar
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }, [])
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX === null) return
    const dx = e.changedTouches[0].clientX - touchStartX
    // Swipe left on sidebar → close, swipe right on main → open
    if (dx < -50 && sidebarOpen) setSidebarOpen(false)
    if (dx > 80 && !sidebarOpen) setSidebarOpen(true)
    setTouchStartX(null)
  }, [touchStartX, sidebarOpen])

  return (
    <div
      className="flex h-screen overflow-hidden bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/admin" className="flex items-center gap-1.5">
            <span className="text-lg font-black uppercase tracking-tight text-foreground">
              SCOOP
            </span>
            <Dot size="sm" className="shrink-0" />
            <span className="text-lg font-black uppercase tracking-tight text-primary">
              ADMIN
            </span>
          </Link>
          <button
            className="rounded p-1 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {navItems.map((item, i) => {
              const Icon = ICON_MAP[item.icon] ?? IconLayoutDashboard
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  } ${sidebarOpen ? 'animate-slide-in-left' : ''}`}
                  style={sidebarOpen ? { animationDelay: `${i * 0.03}s` } : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-3 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <IconExternalLink className="h-4 w-4" />
            Voir le site
          </Link>
          <a
            href="/auth/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
<IconLogout className="h-4 w-4" />
            Déconnexion
          </a>
        </div>
        </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <button
            className="rounded p-2 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <ThemeToggle className="h-8 w-8" />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted"
              >
                <Avatar
                  src={userAvatar}
                  alt={userName ?? userEmail ?? ''}
                  fallback={<IconUser className="h-4 w-4" />}
                  size="sm"
                />
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-none">
                    {userName ?? userEmail}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ROLE_LABELS[userRole]}
                  </p>
                </div>
                <IconChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-card p-1 shadow-lg animate-slide-down">
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-sm font-medium">{userName ?? userEmail}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[userRole]}`}
                      >
                        {ROLE_LABELS[userRole]}
                      </span>
                    </div>
                    <Link
                      href="/admin/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <IconUser className="h-4 w-4" />
                      Mon profil
                    </Link>
                    <a
                      href="/auth/logout"
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <IconLogout className="h-4 w-4" />
                      Déconnexion
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </div>
  )
}
