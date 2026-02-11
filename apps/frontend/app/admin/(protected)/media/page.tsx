import { Heading, Card, CardContent } from 'scoop'
import { IconPhoto, IconUpload, IconLink } from '@tabler/icons-react'
import { fetchMedia } from '@/lib/admin/fetchers'
import { formatDateShort } from '@/lib/formatDate'
import { MediaUploadForm } from './MediaUploadForm'
import { MediaActions } from './MediaActions'

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminMediaPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const { data: media, total } = await fetchMedia({ page, limit: 30 })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="h1" level="h2">
            Bibliothèque de médias
          </Heading>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} fichier{total !== 1 ? 's' : ''} • Images uniquement (vidéos via YouTube)
          </p>
        </div>
      </div>

      {/* Upload section */}
      <MediaUploadForm />

      {/* Media grid */}
      {media.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {media.map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <div className="aspect-square bg-muted">
                <img
                  src={m.url}
                  alt={m.alt ?? ''}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <CardContent className="p-3">
                <p className="truncate text-xs text-muted-foreground">
                  {m.alt ?? m.url.split('/').pop()}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDateShort(m.created_at)}
                  </span>
                  <MediaActions mediaId={m.id} url={m.url} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <IconPhoto className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucun média. Uploadez votre premier fichier.</p>
        </div>
      )}
    </div>
  )
}
