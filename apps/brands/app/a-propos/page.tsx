import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/footer'
import { Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { wwwPath } from '@/lib/site-urls'
import { getBrandAudienceSummary } from '@/lib/brand-audience'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'A propos de Scoop Afrique',
  description:
    "Scoop Afrique est un media digital panafricain base a Abidjan: actualite, culture, terrain, audience sociale massive et recit africain.",
  alternates: { canonical: `${BASE_URL}/a-propos` },
}

const pillars = [
  {
    title: 'Afrique souveraine',
    text: "Mettre en avant les acteurs qui construisent l'autonomie politique, economique, culturelle et technologique du continent.",
  },
  {
    title: 'Afrique ambitieuse',
    text: "Raconter les initiatives, talents et projets qui projettent le continent vers 2050 et au-dela.",
  },
  {
    title: 'Afrique quotidienne',
    text: "Traiter les debats, joies, coleres et sujets de societe qui touchent directement les jeunes africains.",
  },
]

export default async function AboutPage() {
  const audience = await getBrandAudienceSummary()
  const stats = [audience.totalSocial, ...audience.stats]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-card py-14 sm:py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-12 lg:px-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary sm:tracking-[0.28em]">Manifeste</p>
          <h1 className="mt-4 max-w-5xl break-words text-[clamp(2.35rem,12vw,5rem)] font-black leading-[0.98] md:text-7xl" style={{ fontFamily: 'var(--font-headline)' }}>
            L&apos;Afrique doit etre racontee par ses propres voix.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-muted-foreground">
            Scoop Afrique est ne a Abidjan pour donner une voix et une vitrine a une generation africaine qui refuse
            d&apos;etre spectatrice. Nous informons, divertissons, questionnons et construisons des espaces de visibilite pour
            les idees, les talents et les marques qui respectent ce mouvement.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-12 lg:px-20">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:tracking-[0.28em]">{audience.sourceLabel}</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {stats.map((stat) => (
              <Card key={stat.key} className="p-4">
                <p className="break-words text-2xl font-black text-primary sm:text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>{stat.display}</p>
                <p className="mt-2 text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-12 lg:px-20">
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="p-5">
                <Dot size="sm" className="text-primary" />
                <h2 className="mt-4 break-words text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-headline)' }}>
                  {pillar.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{pillar.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-8 md:px-12 lg:grid-cols-[0.42fr_0.58fr] lg:px-20">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary sm:tracking-[0.28em]">Pour les partenaires</p>
            <h2 className="mt-3 break-words text-3xl font-black md:text-5xl" style={{ fontFamily: 'var(--font-headline)' }}>
              Une marque ne loue pas notre audience. Elle entre dans une conversation.
            </h2>
          </div>
          <div className="space-y-5 text-sm leading-7 text-muted-foreground md:text-base">
            <p>
              Notre promesse commerciale est simple: creer des campagnes utiles, visibles et respectueuses de notre public.
              Nous pouvons travailler vite, mais nous ne sacrifions pas le sens pour remplir un calendrier.
            </p>
            <p>
              Les meilleurs partenariats sont ceux qui renforcent une valeur: dignite, ambition, culture, education,
              innovation, souverainete economique ou impact social.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <CtaButton href="/services" variant="outline" className="w-full justify-center sm:w-auto">Voir les offres</CtaButton>
              <CtaButton href="/demander-devis" variant="fillHover" className="w-full justify-center sm:w-auto">Demander un devis</CtaButton>
              <CtaButton href={wwwPath('/')} variant="outline" external className="w-full justify-center sm:w-auto">Lire le media</CtaButton>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 text-sm text-muted-foreground sm:px-8 md:px-12 lg:px-20">
          <p>
            Siege: Abidjan, Cocody Riviera Faya. Contact:{' '}
            <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
              contact@scoop-afrique.com
            </Link>
            .
          </p>
        </div>
      </section>
      <Footer />
    </main>
  )
}
