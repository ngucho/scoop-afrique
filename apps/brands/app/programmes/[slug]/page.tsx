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
    title: `${program.title} - sponsoring`,
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
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-8 sm:py-16 md:px-12 md:py-24">
        <nav className="mb-8 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-widest">
          <Link href="/programmes" className="text-primary transition-colors hover:underline">
            Tous les programmes
          </Link>
        </nav>
        <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-primary sm:text-xs sm:tracking-widest">
          <Dot size="sm" className="text-primary" />
          {program.pillar}
        </p>
        <Heading as="h1" level="h1" className="mb-4 break-words">
          {program.title}
        </Heading>
        <p className="mb-10 text-base font-medium leading-7 text-muted-foreground sm:text-lg">{program.tagline}</p>

        <section className="mb-12 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
          <h2 className="break-words font-sans text-base font-bold uppercase tracking-wide text-foreground sm:tracking-wider">
            Le format
          </h2>
          <p>{program.whatItIs}</p>
          <p>
            <span className="font-medium text-foreground">Rythme indicatif : </span>
            {program.cadence}
          </p>
          <p>
            <span className="font-medium text-foreground">Plateformes : </span>
            {program.platforms.join(' - ')}
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 break-words font-sans text-base font-bold uppercase tracking-wide text-foreground sm:tracking-wider">
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
          <h2 className="mb-4 break-words font-sans text-base font-bold uppercase tracking-wide text-foreground sm:tracking-wider">
            Declinaisons
          </h2>
          <div className="space-y-4">
            {program.formats.map((f) => (
              <Card key={f.name} className="border-border p-5">
                <h3 className="mb-1 break-words font-sans text-sm font-bold text-foreground">{f.name}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{f.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 break-words font-sans text-base font-bold uppercase tracking-wide text-foreground sm:tracking-wider">
            Profils de partenaires
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground md:text-base">
            {program.idealSponsors.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-primary" aria-hidden>
                  -
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 break-words font-sans text-base font-bold uppercase tracking-wide text-foreground sm:tracking-wider">
            Exemples d&apos;activation
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground md:text-base">
            {program.integrationExamples.map((item) => (
              <li key={item} className="flex gap-3">
                <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <Card className="mb-12 border-border bg-muted/30 p-5 sm:p-6">
          <h2 className="mb-2 break-words font-sans text-sm font-bold uppercase tracking-wide text-foreground sm:tracking-wider">
            Transparence & independance
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{program.editorialNote}</p>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <CtaButton href={`/demander-devis?programme=${program.slug}`} variant="fillHover" className="w-full justify-center sm:w-auto">
            Brief sponsoring - {program.title}
          </CtaButton>
          <CtaButton href="/services" variant="outline" className="w-full justify-center sm:w-auto">
            Offres & prix
          </CtaButton>
          <CtaButton href="https://www.scoop-afrique.com" variant="outline" external className="w-full justify-center sm:w-auto">
            Voir le media en ligne
          </CtaButton>
        </div>
      </article>
      <Footer />
    </main>
  )
}
