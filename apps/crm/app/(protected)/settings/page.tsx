import { Heading } from 'scoop'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Paramètres CRM
      </Heading>

      <SettingsClient />
    </div>
  )
}
