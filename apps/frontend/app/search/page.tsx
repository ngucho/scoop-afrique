import Link from 'next/link'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { SearchForm } from './SearchForm'
import { EditorialSearchHero, Button } from 'scoop'

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
