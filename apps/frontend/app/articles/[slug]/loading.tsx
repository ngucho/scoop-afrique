import { ReaderLayout } from '@/components/reader/ReaderLayout'

export default function ArticleDetailLoading() {
  return (
    <ReaderLayout>
      <article className="mx-auto max-w-3xl px-4 py-8 lg:px-8 animate-fade-in">
        <div className="skeleton mb-6 h-4 w-32 rounded" />
        <div className="skeleton mb-8 aspect-video w-full rounded-xl" />
        <div className="space-y-3 mb-6">
          <div className="skeleton h-10 w-3/4 rounded" />
          <div className="skeleton h-5 w-full rounded" />
          <div className="skeleton h-4 w-48 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-4 w-full rounded" />
          ))}
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
      </article>
    </ReaderLayout>
  )
}
