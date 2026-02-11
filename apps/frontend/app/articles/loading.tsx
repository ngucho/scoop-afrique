import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { SkeletonArticleGrid } from '@/components/ui/Skeleton'

export default function ArticlesLoading() {
  return (
    <ReaderLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mb-8 space-y-2">
          <div className="skeleton h-6 w-24 rounded" />
          <div className="skeleton h-10 w-64 rounded" />
          <div className="skeleton h-4 w-48 rounded" />
        </div>
        <div className="mb-8 flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-20 rounded-full" />
          ))}
        </div>
        <SkeletonArticleGrid count={6} />
      </div>
    </ReaderLayout>
  )
}
