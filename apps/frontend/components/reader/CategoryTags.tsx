import Link from 'next/link'
import { READER_CATEGORIES } from '@/lib/readerCategories'

interface CategoryTagsProps {
  categorySlug?: string | null
  categoryName?: string | null
  className?: string
  variant?: 'default' | 'inverse'
}

/** Renders category tags linking to category pages. Uses API category (slug/name) when available; otherwise falls back to READER_CATEGORIES. */
export function CategoryTags({ categorySlug, categoryName, className, variant = 'default' }: CategoryTagsProps) {
  const slug = categorySlug ?? 'actualites'
  const staticCat = READER_CATEGORIES.find((c) => c.slug === slug)
  const label = categoryName ?? staticCat?.label ?? 'Actualités'
  const href = slug === 'actualites' ? '/articles' : `/category/${slug}`
  const toneClassName = variant === 'inverse'
    ? 'border-background/20 bg-background/12 text-background backdrop-blur-md hover:bg-background/18'
    : 'border-border bg-muted/50 text-foreground hover:bg-muted'

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      <Link
        href={href}
        className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${toneClassName}`}
      >
        {label}
      </Link>
    </div>
  )
}
