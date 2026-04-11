import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Footer } from '@/components/footer'
import { Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { AnimatedBroadcastSvg } from '@/components/animated-broadcast-svg'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'À propos de Scoop Afrique',
  description:
    "Découvrez Scoop Afrique, le média digital africain nouvelle génération. Notre mission, notre équipe et notre vision pour l'Afrique.",
  alternates: { canonical: `${BASE_URL}/a-propos` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/a-propos`,
    title: 'À propos de Scoop Afrique',
    description: "Découvrez Scoop Afrique, le média digital africain nouvelle génération.",
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'À propos de Scoop Afrique',
    description: "Découvrez Scoop Afrique, le média digital africain nouvelle génération.",
    images: ['/og-image.png'],
  },
}

const stats = [
  { value: '1,25 M+', label: 'Abonnés' },
  { value: '300 M+', label: 'Vues' },
  { value: '12+', label: 'Pays' },
  { value: '5', label: 'Plateformes' },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero full-width image — Brut style */}
      <section className="relative h-[40vh] min-h-[280px] w-full overflow-hidden border-b border-[var(--surface-border)] sm:h-[50vh]">
        <Image
          src="/images/hero-brands.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'var(--gradient-hero-overlay)' }}
          aria-hidden
        />
        <div className="absolute inset-0 flex items-end p-6 sm:p-8 md:p-12">
          <h1 className="font-sans text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl">
            À propos de <span className="text-primary">Scoop Afrique</span>
          </h1>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:px-12 md:py-16 lg:px-20">
        {/* Storytelling — origins & journey */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Dot size="sm" className="text-primary" />
            Notre histoire
          </div>
          <div className="mb-6 flex justify-center sm:justify-start">
            <AnimatedBroadcastSvg />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tout a commencé par une conviction simple : l&apos;Afrique mérite des médias qui lui ressemblent. En décembre 2025,
            <strong className="text-foreground"> Guy-Landry TAGBA</strong> et <strong className="text-foreground">Ines Laure METSEBO</strong> fondent
            Scoop Afrique SARL à Abidjan — une aventure née de la passion pour l&apos;information et le désir de donner une voix
            authentique à la jeunesse africaine francophone.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Aujourd&apos;hui, avec plus de <strong className="text-foreground">300 millions de vues</strong> et une communauté de
            <strong className="text-foreground"> 1,25 million d&apos;abonnés</strong>, nous faisons partie des nouvelles voix médiatiques
            les plus influentes du continent. Notre credo : rapidité, fiabilité et créativité. Chaque jour, nous produisons
            des contenus audiovisuels qui décryptent l&apos;Afrique autrement.
          </p>
        </div>

        <h2 className="mb-4 font-sans text-base font-semibold uppercase tracking-wider text-foreground">
          Vision & Mission
        </h2>
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          <Card className="border-[var(--surface-border)] p-5">
            <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Vision</h3>
            <p className="text-sm text-muted-foreground">
              Devenir le média de référence de la jeunesse africaine francophone.
            </p>
          </Card>
          <Card className="border-[var(--surface-border)] p-5">
            <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Mission</h3>
            <p className="text-sm text-muted-foreground">
              Donner une voix et une vitrine à l&apos;Afrique en produisant des contenus audiovisuels impactants.
            </p>
          </Card>
        </div>

        <h2 className="mb-4 font-sans text-base font-semibold uppercase tracking-wider text-foreground">
          Siège social
        </h2>
        <p className="mb-2 text-sm text-muted-foreground">
          Abidjan, Cocody Riviera Faya — 01 BP 130 Abidjan 01, Côte d&apos;Ivoire.
        </p>
        <p className="mb-8 text-xs text-muted-foreground">
          RCCM CI-ABJ-03-2025-B12058-06 — SCOOP AFRIQUE SARL
        </p>

        <h2 className="mb-4 font-sans text-base font-semibold uppercase tracking-wider text-foreground">
          Ce qui nous rend uniques
        </h2>
        <ul className="mb-12 list-none space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><Dot size="sm" className="mt-1.5 shrink-0 text-primary" /><span><strong className="text-foreground">100% Digital, 100% Africain</strong> — Créé en Côte d&apos;Ivoire, pour l&apos;Afrique et le monde</span></li>
          <li className="flex items-start gap-2"><Dot size="sm" className="mt-1.5 shrink-0 text-primary" /><span><strong className="text-foreground">Ton éditorial distinctif</strong> — Zen, ferme, confiant, ambitieux</span></li>
          <li className="flex items-start gap-2"><Dot size="sm" className="mt-1.5 shrink-0 text-primary" /><span><strong className="text-foreground">Contenus viraux</strong> — Formats adaptés aux réseaux sociaux modernes</span></li>
          <li className="flex items-start gap-2"><Dot size="sm" className="mt-1.5 shrink-0 text-primary" /><span><strong className="text-foreground">Engagement réel</strong> — Une communauté active et passionnée</span></li>
        </ul>

        <h2 className="mb-4 font-sans text-base font-semibold uppercase tracking-wider text-foreground">
          Nos rubriques
        </h2>
        <ul className="mb-12 list-none space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><Dot size="sm" className="mt-1.5 shrink-0 text-primary" /><span><strong className="text-foreground">Actualité internationale</strong> — Les news qui impactent l&apos;Afrique</span></li>
          <li className="flex items-start gap-2"><Dot size="sm" className="mt-1.5 shrink-0 text-primary" /><span><strong className="text-foreground">Pop culture</strong> — Musique, cinéma, mode, art</span></li>
          <li className="flex items-start gap-2"><Dot size="sm" className="mt-1.5 shrink-0 text-primary" /><span><strong className="text-foreground">Sport</strong> — Football, basketball, athlètes africains</span></li>
          <li className="flex items-start gap-2"><Dot size="sm" className="mt-1.5 shrink-0 text-primary" /><span><strong className="text-foreground">Politique</strong> — Décryptage des enjeux du continent</span></li>
          <li className="flex items-start gap-2"><Dot size="sm" className="mt-1.5 shrink-0 text-primary" /><span><strong className="text-foreground">Économie</strong> — Business, tech, entrepreneuriat africain</span></li>
          <li className="flex items-start gap-2"><Dot size="sm" className="mt-1.5 shrink-0 text-primary" /><span><strong className="text-foreground">Divertissement</strong> — Buzz, tendances, lifestyle africain</span></li>
        </ul>

        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 text-center">
              <div className="font-sans text-lg font-bold text-primary sm:text-xl">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        <Card className="border-primary/20 bg-primary/5 p-6 text-center sm:p-8">
          <h2 className="mb-3 font-sans text-base font-semibold uppercase tracking-wider text-foreground">
            Rejoignez la communauté
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Suivez-nous sur les réseaux sociaux pour ne rien manquer de l&apos;actualité.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <CtaButton href="/strategie-editoriale" variant="outline">
              Notre stratégie éditoriale
            </CtaButton>
            <CtaButton href="/contact" variant="fillHover">
              Découvrir nos réseaux
            </CtaButton>
          </div>
        </Card>
      </article>
      <Footer />
    </main>
  )
}
