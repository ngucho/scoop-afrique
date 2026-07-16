import Link from 'next/link'
import { Heading } from 'scoop'
import { IconArrowLeft } from '@tabler/icons-react'
import { fetchCategories } from '@/lib/admin/fetchers'
import { ArticleJsonImportForm } from './ArticleJsonImportForm'

export default async function AdminArticleImportPage() {
  const categories = await fetchCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/articles"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          aria-label="Retour aux articles"
        >
          <IconArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em] text-primary">
            Import manuel
          </p>
          <Heading as="h1" level="h2" className="mt-2">
            Charger des articles JSON
          </Heading>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Les articles importes sont crees en brouillon. Les images, videos et rubriques non reconnues restent a verifier manuellement.
          </p>
        </div>
      </div>

      <ArticleJsonImportForm categories={categories} />
    </div>
  )
}
