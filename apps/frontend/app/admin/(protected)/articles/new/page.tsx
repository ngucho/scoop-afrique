import { getAdminSession } from '@/lib/admin/session'
import { fetchCategories } from '@/lib/admin/fetchers'
import { ArticleEditorForm } from '../ArticleEditorForm'

export default async function AdminNewArticlePage() {
  const [adminSession, categories] = await Promise.all([
    getAdminSession(),
    fetchCategories(),
  ])

  return (
    <ArticleEditorForm
      categories={categories}
      authorName={adminSession?.metadata?.name ?? adminSession?.name ?? adminSession?.email ?? ''}
    />
  )
}
