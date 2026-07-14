import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Footer } from '@/components/footer'
import { CtaButton } from '@/components/cta-button'
import { AnimatedSection } from '@/components/animated-section'
import { editorialPrograms } from '@/lib/programs-data'
import { Dot } from 'scoop'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Programmes editoriaux & sponsoring',
  description:
    'Decouvrez nos formats phares (Scoop Game, Canape sans filtre, Get Ready, La rue repond, reportages, Batisseurs) et les opportunites de partenariat pour les marques.',
  alternates: { canonical: `${BASE_URL}/programmes` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/programmes`,
    title: 'Programmes editoriaux | Scoop Afrique',
    description:
      'Formats recurrents, audience jeune afro-francophone, integrations natives - demandez un brief sponsoring.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/images/hero-brands.png`, width: 1200, height: 630, alt: 'Scoop Afrique - Programmes' }],
  },
}

const visuals = [
  '/images/video-premium.jpg',
  '/images/podcast-interview.jpg',
  '/images/carousel-3.png',
  '/images/carousel-1.jpg',
  '/images/offre-campagnes.jpg',
  '/images/video-gold.jpg',
]

export default function ProgrammesPage() {
  return (
    <main className="min-h-screen bg-foreground text-background">
      <article className="overflow-hidden">
        <section className="relative border-b border-background/10 px-5 py-20 sm:px-8 md:px-12 md:py-28 lg:px-20">
          <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_20%_10%,rgba(239,35,60,0.75),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_45%)]" />
          <div className="noise-overlay absolute inset-0 opacity-10" />
          <div className="relative mx-auto max-w-7xl">
            <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
              <Dot size="sm" className="text-primary" />
              Programmes sponsorisables
            </p>
            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.95] text-background md:text-7xl" style={{ fontFamily: 'var(--font-headline)' }}>
              Choisissez le programme que votre marque peut habiter.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-background/70 md:text-lg">
              Un catalogue de formats recurrents, pense comme une plateforme de rendez-vous : episodes, saisons, extraits,
              integrations natives et pages detaillees pour cadrer le sponsoring.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-widest text-background/65">
              <span className="rounded-full border border-background/15 px-4 py-2">Saisons</span>
              <span className="rounded-full border border-background/15 px-4 py-2">Episodes</span>
              <span className="rounded-full border border-background/15 px-4 py-2">Clips courts</span>
              <span className="rounded-full border border-background/15 px-4 py-2">Naming sponsor</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:px-12 lg:px-20">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">A l&apos;affiche</p>
              <h2 className="mt-2 text-2xl font-black uppercase text-background md:text-3xl">Nos formats originaux</h2>
            </div>
            <p className="hidden max-w-md text-sm leading-6 text-background/58 md:block">
              Comparez les formats, puis ouvrez le detail sponsoring du programme qui colle a votre marque.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {editorialPrograms.map((p, i) => (
              <AnimatedSection key={p.slug} animation="fade-in-up" delay={i * 0.06}>
                <Link href={`/programmes/${p.slug}`} className="group block h-full">
                  <div className="relative flex min-h-[520px] overflow-hidden rounded-2xl border border-background/10 bg-background/8 shadow-2xl transition duration-500 hover:-translate-y-2 hover:border-primary/60">
                    <Image
                      src={visuals[i % visuals.length]}
                      alt=""
                      fill
                      className="object-cover opacity-72 transition duration-700 group-hover:scale-105 group-hover:opacity-90"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                    <div className="relative mt-auto p-6">
                      <span className="mb-3 inline-flex rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                        {p.pillar}
                      </span>
                      <h3 className="text-3xl font-black uppercase leading-none text-white md:text-4xl">{p.title}</h3>
                      <p className="mt-3 min-h-[48px] text-sm font-medium leading-6 text-white/78">{p.tagline}</p>
                      <p className="mt-5 line-clamp-3 text-sm leading-6 text-white/62">{p.cardSummary}</p>
                      <span className="mt-6 inline-flex font-mono text-xs uppercase tracking-widest text-primary">
                        Voir le detail sponsoring
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </section>

        <section className="border-t border-background/10 px-5 py-16 sm:px-8 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl rounded-2xl border border-background/10 bg-background p-8 text-foreground md:p-10">
            <h2 className="text-3xl font-black uppercase md:text-4xl">Prochaine etape</h2>
            <p className="mt-3 mb-6 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              Indiquez-nous le programme, votre budget indicatif et la periode souhaitee. Nous revenons avec une proposition
              claire : emplacements, livrables, calendrier et mentions.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CtaButton href="/demander-devis" variant="fillHover">
                Demander un devis
              </CtaButton>
              <CtaButton href="/services" variant="outline">
                Voir les offres & prix
              </CtaButton>
              <CtaButton href="mailto:contact@scoop-afrique.com" variant="outline" external>
                contact@scoop-afrique.com
              </CtaButton>
            </div>
          </div>
        </section>
      </article>
      <Footer />
    </main>
  )
}
