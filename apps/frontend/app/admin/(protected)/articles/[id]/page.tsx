import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

/** Redirect /admin/articles/:id → /admin/articles/:id/edit */
export default async function AdminArticleRedirect({ params }: PageProps) {
  const { id } = await params
  redirect(`/admin/articles/${id}/edit`)
}
