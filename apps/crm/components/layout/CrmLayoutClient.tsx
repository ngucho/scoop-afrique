'use client'

import { useState } from 'react'
import { CrmSidebar } from './CrmSidebar'
import { CrmHeader } from './CrmHeader'

export function CrmLayoutClient({
  userEmail,
  userName,
  userAvatar,
  children,
}: {
  userEmail?: string
  userName?: string
  userAvatar?: string
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay lg:hidden"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <CrmSidebar onMenuClick={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <CrmHeader
          userEmail={userEmail}
          userName={userName}
          userAvatar={userAvatar}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
