import { Heading, Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { RemindersClient } from '@/components/reminders/RemindersClient'

export default async function RemindersPage() {
  const [remindersRes, contactsRes] = await Promise.all([
    crmGetServer<Array<Record<string, unknown>>>('reminders?limit=50'),
    crmGetServer<Array<Record<string, unknown>>>('contacts?limit=100'),
  ])
  const reminders = remindersRes?.data ?? []
  const contacts = (contactsRes?.data ?? []).map((c) => ({
    id: c.id as string,
    first_name: c.first_name as string,
    last_name: c.last_name as string,
  }))

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Relances
      </Heading>

      <RemindersClient
        initialReminders={reminders}
        contacts={contacts}
      />
    </div>
  )
}
