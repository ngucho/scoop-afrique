import type { Metadata } from 'next'
import Link from 'next/link'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { Heading, Text, Dot, SectionHeader } from 'scoop'
import { toYoutubeEmbedUrl } from '@/lib/youtube'

export const metadata: Metadata = {
  title: 'Vidéos',
  description:
    'Vidéos à la demande — reportages, décryptages et contenus Scoop Afrique. La plateforme de streaming du média panafricain.',
}

/* Vidéos en avant : ajouter des URLs YouTube (watch ou youtu.be) pour afficher les embeds. */
const FEATURED_VIDEOS: { id: string; title: string; description: string; youtubeUrl: string }[] = [
  {
    id: 'feature-1',
    title: 'Reportages & décryptages',
    description: 'Retrouvez nos reportages et analyses sur l’actualité panafricaine.',
    youtubeUrl: '', // Ex: https://www.youtube.com/watch?v=VIDEO_ID
  },
  {
    id: 'feature-2',
    title: 'Couverture événementielle',
    description: 'Événements, culture et sport vus par Scoop Afrique.',
    youtubeUrl: '',
  },
  {
    id: 'feature-3',
    title: 'Interviews & débats',
    description: 'Entretiens et débats avec les voix qui comptent.',
    youtubeUrl: '',
  },
]

function VideoCard({
  title,
  description,
  youtubeUrl,
}: {
  title: string
  description: string
  youtubeUrl: string
}) {
  const embedUrl = toYoutubeEmbedUrl(youtubeUrl)
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-white/10">
      <div className="aspect-video w-full overflow-hidden bg-black/40">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl text-white/20">▶</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-[var(--font-scoop)] text-lg font-bold tracking-tight text-foreground group-hover:text-primary">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </article>
  )
}

export default function VideoPage() {
  return (
    <ReaderLayout>
      <main className="min-h-screen">
        {/* Hero — style streaming / VOD */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-background via-background to-primary/5">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            aria-hidden
            style={{
              backgroundImage: `
                radial-gradient(ellipse 80% 50% at 50% -20%, var(--primary) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 100% 50%, oklch(0.6 0.2 25 / 0.15) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 0% 80%, oklch(0.5 0.2 25 / 0.1) 0%, transparent 50%)
              `,
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
              <Dot size="sm" />
              Vidéos à la demande
            </div>
            <Heading
              as="h1"
              level="h1"
              className="mt-4 max-w-3xl font-[var(--font-scoop)] text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
            >
              La plateforme vidéo de Scoop Afrique
            </Heading>
            <Text variant="lead" className="mt-6 max-w-2xl text-muted-foreground">
              Reportages, décryptages et contenus exclusifs. Aujourd’hui nos vidéos sont sur YouTube ; bientôt une
              expérience de streaming dédiée pour nos lecteurs.
            </Text>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="https://www.youtube.com/@Scoop.Afrique"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-primary bg-primary px-5 py-2.5 font-bold text-primary-foreground transition-colors hover:opacity-90"
              >
                <span aria-hidden>▶</span>
                Chaîne YouTube
              </a>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-5 py-2.5 font-medium text-foreground transition-colors hover:bg-muted"
              >
                Voir les articles
              </Link>
            </div>
          </div>
        </section>

        {/* À regarder — grille de vidéos (YouTube embeds pour l’instant) */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeader label="À regarder" className="mb-2" />
          <Heading as="h2" level="h2" className="mb-8 font-[var(--font-scoop)] text-2xl font-semibold tracking-tight">
            Vidéos du moment
          </Heading>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_VIDEOS.map((video) => (
              <VideoCard
                key={video.id}
                title={video.title}
                description={video.description}
                youtubeUrl={video.youtubeUrl}
              />
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Plus de vidéos sur notre chaîne{' '}
            <a
              href="https://www.youtube.com/@Scoop.Afrique"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              YouTube
            </a>
            . Notre plateforme de streaming arrivera progressivement.
          </p>
        </section>

        {/* Bandeau « En construction » */}
        <section className="border-t border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Plateforme en construction
            </p>
            <p className="mt-2 text-foreground">
              Nous préparons une expérience vidéo dédiée pour nos lecteurs : VOD, playlists et contenus exclusifs.
              En attendant, toutes nos vidéos restent disponibles sur YouTube.
            </p>
          </div>
        </section>
      </main>
    </ReaderLayout>
  )
}
