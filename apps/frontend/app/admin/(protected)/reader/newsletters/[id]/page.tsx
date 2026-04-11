import { redirect, notFound } from 'next/navigation'
import { Heading } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canManageReaderOperations } from '@/lib/admin/rbac'
import { fetchNewsletterCampaign } from '@/lib/admin/fetchers'
import { NewsletterCampaignEditor } from '../NewsletterCampaignEditor'

export default async function NewsletterCampaignEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canManageReaderOperations(session.role)) redirect('/admin')

  const campaign = await fetchNewsletterCampaign(id)
  if (!campaign) notFound()

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h2">
        Éditer la campagne
      </Heading>
      <NewsletterCampaignEditor initial={campaign} />
    </div>
  )
}
