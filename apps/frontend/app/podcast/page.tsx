import type { Metadata } from 'next'
import Link from 'next/link'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { Heading, Text, Dot, SectionHeader } from 'scoop'
import { IconHeadphones, IconMicrophone } from '@tabler/icons-react'

export const metadata: Metadata = {
  title: 'Podcasts',
  description:
    'Podcasts et émissions Scoop Afrique — interviews, débats et décryptages. Écoutez le média panafricain en audio.',
}

/* Épisodes à venir : pour l’instant placeholders ; plus tard flux RSS ou API. */
const PLACEHOLDER_EPISODES = [
  {
    id: 'ep-1',
    title: 'Interviews & invités',
    description: 'Des entretiens avec les personnalités qui font l’actualité.',
    duration: '—',
    status: 'soon' as const,
  },
  {
    id: 'ep-2',
    title: 'Débats & analyses',
    description: 'Décryptage de l’actualité en format audio.',
    duration: '—',
    status: 'soon' as const,
  },
  {
    id: 'ep-3',
    title: 'Culture & société',
    description: 'Pop culture, sport et sujets de société.',
    duration: '—',
    status: 'soon' as const,
  },
]

function EpisodeCard({
  title,
  description,
  duration,
  status,
}: {
  title: string
  description: string
  duration: string
  status: 'soon'
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-white/10 sm:flex-row">
      <div className="flex aspect-square w-full shrink-0 items-center justify-center bg-primary/10 sm:w-48">
        <IconMicrophone className="h-14 w-14 text-primary/60" aria-hidden />
      </div>
      <div className="flex flex-1 flex-col justify-center p-5">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">Bientôt</span>
        <h3 className="mt-1 font-[var(--font-scoop)] text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {duration && (
          <p className="mt-2 text-xs text-muted-foreground">{duration}</p>
        )}
      </div>
    </article>
  )
}

export default function PodcastPage() {
  return (
    <ReaderLayout>
      <main className="min-h-screen">
        {/* Hero — style podcast / audio */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-background via-background to-primary/5">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            aria-hidden
            style={{
              backgroundImage: `
                radial-gradient(ellipse 80% 50% at 50% -20%, var(--primary) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 0% 50%, oklch(0.6 0.2 25 / 0.12) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 100% 80%, oklch(0.5 0.2 25 / 0.1) 0%, transparent 50%)
              `,
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
              <Dot size="sm" />
              Podcasts & audio
            </div>
            <Heading
              as="h1"
              level="h1"
              className="mt-4 max-w-3xl font-[var(--font-scoop)] text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl"
            >
              Écoutez Scoop Afrique
            </Heading>
            <Text variant="lead" className="mt-6 max-w-2xl text-muted-foreground">
              Interviews, débats et décryptages en format audio. Nos podcasts arrivent sur cette page ; en attendant,
              retrouvez nos contenus sur les plateformes habituelles.
            </Text>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-5 py-2.5">
                <IconHeadphones className="h-5 w-5 text-primary" aria-hidden />
                <span className="font-medium text-foreground">Podcasts à venir</span>
              </div>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-primary bg-primary px-5 py-2.5 font-bold text-primary-foreground transition-colors hover:opacity-90"
              >
                Lire les articles
              </Link>
            </div>
          </div>
        </section>

        {/* Épisodes à venir */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeader label="À écouter" className="mb-2" />
          <Heading as="h2" level="h2" className="mb-8 font-[var(--font-scoop)] text-2xl font-semibold tracking-tight">
            Prochaines émissions
          </Heading>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDER_EPISODES.map((ep) => (
              <EpisodeCard
                key={ep.id}
                title={ep.title}
                description={ep.description}
                duration={ep.duration}
                status={ep.status}
              />
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Nous préparons des formats podcast dédiés. Contact :{' '}
            <a
              href="mailto:Contact@scoop-afrique.com?subject=Podcast"
              className="font-medium text-primary hover:underline"
            >
              Contact@scoop-afrique.com
            </a>
          </p>
        </section>

        {/* Bandeau « En construction » */}
        <section className="border-t border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Podcasts en préparation
            </p>
            <p className="mt-2 text-foreground">
              Interviews exclusives, débats et analyses en audio : tout arrive bientôt sur cette page et sur les
              plateformes (Spotify, Apple Podcasts, etc.).
            </p>
          </div>
        </section>
      </main>
    </ReaderLayout>
  )
}
