import { redirect } from 'next/navigation'
import { Heading, Card, CardContent } from 'scoop'
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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Reader chrome</p>
          <Heading as="h1" level="h2" className="mt-2">
            Messages d&apos;emplacements vides
          </Heading>
          <p className="mt-2 text-sm text-muted-foreground">
            Gardez les zones publicitaires propres quand aucun annonceur n&apos;est actif, sans casser le rythme de lecture.
          </p>
        </div>
        <ChromeSettingsModal initial={initial} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Apercu lecteur</p>
            <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-5">
              <p className="text-sm font-semibold">{initial?.empty_ad_title || 'Votre message titre apparait ici'}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {initial?.empty_ad_subtitle || 'Ajoutez une phrase courte pour transformer un emplacement vide en signal utile.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Bon usage</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Le texte doit rester court, neutre et compatible mobile. Il remplace les pubs absentes dans les rails,
              bannieres et blocs article.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
