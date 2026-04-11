import Link from 'next/link'
import type { Metadata } from 'next'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { SearchForm } from './SearchForm'
import { EditorialSearchHero, Button } from 'scoop'
import { config } from '@/lib/config'

const SITE_URL = config.siteUrl.replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Recherche',
  description:
    "Recherchez parmi les articles Scoop.Afrique : actualités, analyses et rubriques panafricaines. Résultats sur la page Articles.",
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    title: 'Recherche | Scoop.Afrique',
    description: 'Trouvez un sujet, une rubrique ou un article sur le média.',
    url: `${SITE_URL}/search`,
    siteName: 'Scoop.Afrique',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: { card: 'summary_large_image', title: 'Recherche | Scoop.Afrique' },
  robots: { index: true, follow: true },
}

export default function SearchPage() {
  return (
    <ReaderLayout>
      <EditorialSearchHero
        title="Explorez tout le site"
        description="Articles, analyses et rubriques — un moteur unique pour retrouver les sujets qui comptent pour l'Afrique."
        footer={
          <>
            <Button asChild variant="outline" size="sm" className="rounded-full border-border bg-background/60">
              <Link href="/articles">Tous les articles</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full border-border bg-background/60">
              <Link href="/">Accueil</Link>
            </Button>
          </>
        }
      >
        <SearchForm variant="hero" />
      </EditorialSearchHero>
    </ReaderLayout>
  )
}
