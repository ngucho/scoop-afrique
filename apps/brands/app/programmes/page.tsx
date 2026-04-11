import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/footer'
import { CtaButton } from '@/components/cta-button'
import { AnimatedSection } from '@/components/animated-section'
import { editorialPrograms } from '@/lib/programs-data'
import { Card, Dot, Heading } from 'scoop'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Programmes éditoriaux & sponsoring',
  description:
    'Découvrez nos formats phares (Scoop Game, Canapé sans filtre, Get Ready, La rue répond, reportages, Bâtisseurs) et les opportunités de partenariat pour les marques.',
  alternates: { canonical: `${BASE_URL}/programmes` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/programmes`,
    title: 'Programmes éditoriaux | Scoop Afrique',
    description:
      'Formats récurrents, audience jeune afro-francophone, intégrations natives — demandez un brief sponsoring.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/images/hero-brands.png`, width: 1200, height: 630, alt: 'Scoop Afrique — Programmes' }],
  },
}

export default function ProgrammesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Dot size="sm" className="text-primary" />
          Espace annonceurs
        </p>
        <Heading as="h1" level="h1" className="mb-4 max-w-3xl">
          Des programmes qui reviennent chaque semaine — et une place pour votre marque
        </Heading>
        <p className="mb-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          Voici les formats que nous produisons sur la durée : ils rassemblent déjà des centaines de milliers de personnes
          sur TikTok, Instagram, Facebook et YouTube. Chaque programme peut accueillir un partenariat réfléchi : naming de
          saison, intégration produit, rubrique co-construite — toujours avec validation éditoriale et transparence pour le
          public.
        </p>
        <p className="mb-12 max-w-2xl text-sm text-muted-foreground">
          Chiffres audience (mars 2026, analytics internes) :{' '}
          <strong className="font-medium text-foreground">+1,4 M abonnés cumulés</strong>, dont{' '}
          <strong className="font-medium text-foreground">910 K sur TikTok</strong> et{' '}
          <strong className="font-medium text-foreground">410 K sur Facebook</strong> (compte monétisé). Pour voir le rendu
          éditorial en contexte, rendez-vous sur{' '}
          <a
            href="https://www.scoop-afrique.com"
            className="text-primary underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            scoop-afrique.com
          </a>
          .
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {editorialPrograms.map((p, i) => (
            <AnimatedSection key={p.slug} animation="fade-in-up" delay={i * 0.06}>
              <Link href={`/programmes/${p.slug}`} className="group block h-full">
                <Card className="h-full border-border transition-all duration-300 hover:border-primary/40 hover:shadow-md">
                  <div className="flex h-full flex-col p-6 md:p-8">
                    <span className="mb-2 font-mono text-[10px] uppercase tracking-widest text-primary">{p.pillar}</span>
                    <h2 className="mb-2 font-sans text-lg font-bold uppercase tracking-tight text-foreground md:text-xl">
                      {p.title}
                    </h2>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">{p.tagline}</p>
                    <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">{p.cardSummary}</p>
                    <span className="font-mono text-xs uppercase tracking-widest text-primary group-hover:underline">
                      Voir l’opportunité sponsoring →
                    </span>
                  </div>
                </Card>
              </Link>
            </AnimatedSection>
          ))}
        </div>

        <Card className="mt-16 border-primary/20 bg-primary/5 p-8 md:p-10">
          <Heading as="h2" level="h2" className="mb-3">
            Prochaine étape
          </Heading>
          <p className="mb-6 max-w-2xl text-sm text-muted-foreground md:text-base">
            Indiquez-nous le programme qui vous intéresse, votre budget indicatif et la période souhaitée. Nous revenons vers
            vous avec une proposition claire : emplacements, livrables, calendrier et mentions.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CtaButton href="/demander-devis" variant="fillHover">
              Demander un devis
            </CtaButton>
            <CtaButton href="/tarifs" variant="outline">
              Voir la grille tarifaire
            </CtaButton>
            <CtaButton href="mailto:contact@scoop-afrique.com" variant="outline" external>
              contact@scoop-afrique.com
            </CtaButton>
          </div>
        </Card>
      </article>
      <Footer />
    </main>
  )
}
