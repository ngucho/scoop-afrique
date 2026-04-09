import { redirect } from 'next/navigation'
import { Heading } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canManageReaderOperations } from '@/lib/admin/rbac'
import { fetchHomepageSections } from '@/lib/admin/fetchers'
import { HomepageSectionEditor } from './HomepageSectionEditor'

const LAYOUT_LABELS: Record<string, string> = {
  featured_grid: 'Grille mise en avant',
  list: 'Liste',
  carousel: 'Carrousel',
}

export default async function ReaderHomepagePage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canManageReaderOperations(session.role)) redirect('/admin')

  const sections = await fetchHomepageSections()

  return (
    <div className="space-y-6">
      <div>
        <Heading as="h1" level="h2">
          Page d&apos;accueil — sections
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          Ordre, visibilité et disposition des blocs reader. Le JSON de configuration permet d&apos;ajuster limites et
          filtres (ex. nombre d&apos;articles, tags).
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((s) => (
          <HomepageSectionEditor key={s.id} section={s} layoutLabels={LAYOUT_LABELS} />
        ))}
      </div>
    </div>
  )
}
