import { redirect } from 'next/navigation'
import { Heading } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canEditAnnouncements } from '@/lib/admin/rbac'
import { fetchChromeSettings } from '@/lib/admin/fetchers'
import { ChromeSettingsModal } from './ChromeSettingsModal'

export default async function ReaderChromeSettingsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canEditAnnouncements(session.role)) redirect('/admin')

  const initial = await fetchChromeSettings()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Heading as="h1" level="h2">
            Message emplacements pub vides
          </Heading>
          <p className="mt-1 text-sm text-muted-foreground">
            Personnalise le message affiché quand aucune campagne n’occupe un emplacement (rail article, bannières,
            etc.).
          </p>
        </div>
        <ChromeSettingsModal initial={initial} />
      </div>
      <p className="text-sm text-muted-foreground">
        Cliquez sur « Éditer les textes » pour ouvrir le formulaire dans une fenêtre.
      </p>
    </div>
  )
}
