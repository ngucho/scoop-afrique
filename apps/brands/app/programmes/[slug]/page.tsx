import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/footer'
import { CtaButton } from '@/components/cta-button'
import { getAllProgramSlugs, getProgramBySlug } from '@/lib/programs-data'
import { Card, Dot, Heading } from 'scoop'

const BASE_URL = 'https://brands.scoop-afrique.com'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getAllProgramSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const program = getProgramBySlug(slug)
  if (!program) return { title: 'Programme' }
  const url = `${BASE_URL}/programmes/${slug}`
  return {
    title: `${program.title} — sponsoring`,
    description: program.cardSummary,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: `${program.title} | Scoop Afrique`,
      description: program.tagline,
      siteName: 'Scoop Afrique',
      images: [{ url: `${BASE_URL}/images/hero-brands.png`, width: 1200, height: 630, alt: program.title }],
    },
  }
}

export default async function ProgrammeDetailPage({ params }: Props) {
  const { slug } = await params
  const program = getProgramBySlug(slug)
  if (!program) notFound()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-24">
        <nav className="mb-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/programmes" className="text-primary transition-colors hover:underline">
            ← Tous les programmes
          </Link>
        </nav>
        <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
          <Dot size="sm" className="text-primary" />
          {program.pillar}
        </p>
        <Heading as="h1" level="h1" className="mb-4">
          {program.title}
        </Heading>
        <p className="mb-10 text-lg font-medium text-muted-foreground">{program.tagline}</p>

        <section className="mb-12 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
          <h2 className="font-sans text-base font-bold uppercase tracking-wider text-foreground">Le format</h2>
          <p>{program.whatItIs}</p>
          <p>
            <span className="font-medium text-foreground">Rythme indicatif : </span>
            {program.cadence}
          </p>
          <p>
            <span className="font-medium text-foreground">Plateformes : </span>
            {program.platforms.join(' · ')}
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">
            Ce que les partenaires gagnent
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground md:text-base">
            {program.sponsorValue.map((item) => (
              <li key={item} className="flex gap-3">
                <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">Déclinaisons</h2>
          <div className="space-y-4">
            {program.formats.map((f) => (
              <Card key={f.name} className="border-border p-5">
                <h3 className="mb-1 font-sans text-sm font-bold text-foreground">{f.name}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">
            Profils de partenaires
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground md:text-base">
            {program.idealSponsors.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-primary" aria-hidden>
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">
            Exemples d’activation
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground md:text-base">
            {program.integrationExamples.map((item) => (
              <li key={item} className="flex gap-3">
                <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <Card className="mb-12 border-border bg-muted/30 p-6">
          <h2 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-foreground">
            Transparence & indépendance
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{program.editorialNote}</p>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <CtaButton href={`/demander-devis?programme=${program.slug}`} variant="fillHover">
            Brief sponsoring — {program.title}
          </CtaButton>
          <CtaButton href="/tarifs" variant="outline">
            Grille tarifaire
          </CtaButton>
          <CtaButton href="https://www.scoop-afrique.com" variant="outline" external>
            Voir le média en ligne
          </CtaButton>
        </div>
      </article>
      <Footer />
    </main>
  )
}
