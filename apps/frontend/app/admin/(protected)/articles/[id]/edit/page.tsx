import { notFound } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/session'
import { fetchAdminArticle, fetchCategories } from '@/lib/admin/fetchers'
import { ArticleEditorForm } from '../../ArticleEditorForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEditArticlePage({ params }: PageProps) {
  const { id } = await params
  const [article, adminSession, categories] = await Promise.all([
    fetchAdminArticle(id),
    getAdminSession(),
    fetchCategories(),
  ])

  if (!article) notFound()

  return (
    <ArticleEditorForm
      article={article}
      categories={categories}
      authorName={adminSession?.metadata?.name ?? adminSession?.name ?? adminSession?.email ?? ''}
    />
  )
}
