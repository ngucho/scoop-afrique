import { redirect } from 'next/navigation'
import { Heading } from 'scoop'
import { Eye, LayoutGrid, Settings2 } from 'lucide-react'
import { getAdminSession } from '@/lib/admin/session'
import { canManageReaderHomepage } from '@/lib/admin/rbac'
import { fetchHomepageSections } from '@/lib/admin/fetchers'
import { HomepageSectionEditor } from './HomepageSectionEditor'

const LAYOUT_LABELS: Record<string, string> = {
  featured_grid: 'Grille mise en avant',
  list: 'Liste éditoriale (une seule fois)',
  carousel: 'Rail de cartes',
}

export default async function ReaderHomepagePage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canManageReaderHomepage(session.role)) redirect('/admin')

  const sections = await fetchHomepageSections()
  const visibleCount = sections.filter((section) => section.is_visible).length
  const homeCount = sections.filter((section) => section.key !== 'partnership_strip').length

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Reader</p>
            <Heading as="h1" level="h2" className="mt-2">
              Configuration de l&apos;accueil
            </Heading>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Pilotez l&apos;ordre, la visibilité, les titres et les rails d&apos;articles affichés sur la homepage lecteur.
              L&apos;expérience publique reste proche d&apos;une plateforme de streaming : grandes cartes qui défilent,
              sélection récente, articles consultés récemment et publicités injectées dans les rails.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:w-[420px]">
            <div className="rounded-xl border border-border bg-background p-3">
              <Eye className="h-4 w-4 text-primary" aria-hidden />
              <p className="mt-2 text-2xl font-black text-foreground">{visibleCount}</p>
              <p className="text-xs text-muted-foreground">sections visibles</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <LayoutGrid className="h-4 w-4 text-primary" aria-hidden />
              <p className="mt-2 text-2xl font-black text-foreground">{homeCount}</p>
              <p className="text-xs text-muted-foreground">blocs accueil</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <Settings2 className="h-4 w-4 text-primary" aria-hidden />
              <p className="mt-2 text-2xl font-black text-foreground">48h</p>
              <p className="text-xs text-muted-foreground">fenêtre à la une</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <HomepageSectionEditor key={s.id} section={s} layoutLabels={LAYOUT_LABELS} />
        ))}
      </div>
    </div>
  )
}
