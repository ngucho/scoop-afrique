import { ReaderSidebar } from './ReaderSidebar'
import { ReaderFooter } from './ReaderFooter'
import { apiGet } from '@/lib/api/client'
import type { Category } from '@/lib/api/types'

async function getCategories(): Promise<Category[]> {
  try {
    const res = await apiGet<{ data: Category[] }>('/categories', { revalidate: 600 })
    return res.data ?? []
  } catch {
    return []
  }
}

export async function ReaderLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories()
  return (
    <div className="min-h-screen bg-background">
      <ReaderSidebar categories={categories} />
      <div className="flex min-h-screen flex-col pt-14 md:pt-0 md:pl-64 lg:pl-72">
        <main className="flex-1">{children}</main>
        <ReaderFooter />
      </div>
    </div>
  )
}
