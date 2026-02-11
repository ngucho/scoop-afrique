import Link from 'next/link'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { SearchForm } from './SearchForm'
import { Heading, Text, SectionHeader, Button } from 'scoop'

export default function SearchPage() {
  return (
    <ReaderLayout>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <header className="mb-10">
          <SectionHeader label="Recherche" className="mb-4" />
          <Heading as="h1" level="h1" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Rechercher
          </Heading>
          <Text variant="muted" className="mt-3">
            Trouvez des articles par mot-clé. Vous pouvez aussi parcourir les catégories ou la liste des articles.
          </Text>
        </header>

        <SearchForm />

        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/articles">Voir tous les articles</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Accueil</Link>
          </Button>
        </div>
      </div>
    </ReaderLayout>
  )
}
