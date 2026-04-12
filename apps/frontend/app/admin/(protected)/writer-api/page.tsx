import { redirect } from 'next/navigation'
import { Heading, Text } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { hasMinRole, type AppRole } from '@/lib/admin/rbac'
import { fetchWriterApiKeys } from '@/lib/admin/fetchers'
import { WriterApiKeysPanel } from './WriterApiKeysPanel'

export default async function WriterApiPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!hasMinRole(session.role as AppRole, 'journalist')) redirect('/admin')

  const keys = await fetchWriterApiKeys()

  return (
    <div className="space-y-6">
      <div>
        <Heading as="h1" level="h2">
          API rédaction (brouillons)
        </Heading>
        <Text variant="muted" className="mt-2 max-w-3xl text-sm leading-relaxed">
          Créez des clés pour vos scripts ou outils LLM : elles permettent uniquement de{' '}
          <strong>créer ou mettre à jour des brouillons</strong>. La publication reste manuelle dans le backoffice
          (éditeur / manager / admin). Documentation : fichier{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/WRITER_API.md</code> à la racine du dépôt
          webapp.
        </Text>
      </div>
      <WriterApiKeysPanel initialKeys={keys.filter((k) => !k.revoked_at)} />
    </div>
  )
}
