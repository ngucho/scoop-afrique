import Link from 'next/link'
import { READER_CATEGORIES } from '@/lib/readerCategories'

interface CategoryTagsProps {
  categorySlug?: string | null
  categoryName?: string | null
  className?: string
}

/** Renders category tags linking to category pages. Uses API category (slug/name) when available; otherwise falls back to READER_CATEGORIES. */
export function CategoryTags({ categorySlug, categoryName, className }: CategoryTagsProps) {
  const slug = categorySlug ?? 'actualites'
  const staticCat = READER_CATEGORIES.find((c) => c.slug === slug)
  const label = categoryName ?? staticCat?.label ?? 'Actualités'
  const href = slug === 'actualites' ? '/articles' : `/category/${slug}`

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      <Link
        href={href}
        className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        {label}
      </Link>
    </div>
  )
}
