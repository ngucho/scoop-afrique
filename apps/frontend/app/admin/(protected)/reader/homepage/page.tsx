import { redirect } from 'next/navigation'
import { Heading } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canManageReaderHomepage } from '@/lib/admin/rbac'
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
  if (!canManageReaderHomepage(session.role)) redirect('/admin')

  const sections = await fetchHomepageSections()

  return (
    <div className="space-y-6">
      <div>
        <Heading as="h1" level="h2">
          Page d&apos;accueil — sections
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque section s’ouvre dans une modale via « Configurer la section » pour gagner de la place. Les lignes{' '}
          <strong className="font-medium text-foreground">home_ad_mid</strong> et{' '}
          <strong className="font-medium text-foreground">home_ad_bottom</strong> insèrent les encarts pub à la position
          voulue (champ ordre). La section{' '}
          <strong className="font-medium text-foreground">partnership_strip</strong> contrôle le bandeau partenariats au-dessus
          du footer sur tout le site lecteur. Réservé aux rôles{' '}
          <strong className="font-medium text-foreground">manager</strong> et{' '}
          <strong className="font-medium text-foreground">admin</strong>.
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
