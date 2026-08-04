'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { CrmCapabilities } from '@/lib/rbac'

const CrmCapabilitiesContext = createContext<CrmCapabilities>({
  canRead: false,
  canWrite: false,
  canManage: false,
})

export function CrmCapabilitiesProvider({
  capabilities,
  children,
}: {
  capabilities: CrmCapabilities
  children: ReactNode
}) {
  return (
    <CrmCapabilitiesContext.Provider value={capabilities}>
      {children}
    </CrmCapabilitiesContext.Provider>
  )
}

export function useCrmCapabilities(): CrmCapabilities {
  return useContext(CrmCapabilitiesContext)
}

export function CrmCapabilityGate({
  capability,
  children,
}: {
  capability: 'write' | 'manage'
  children: ReactNode
}) {
  const capabilities = useCrmCapabilities()
  const allowed =
    capability === 'manage'
      ? capabilities.canManage
      : capabilities.canWrite

  return allowed ? children : null
}
