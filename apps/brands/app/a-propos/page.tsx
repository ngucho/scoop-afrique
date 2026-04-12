import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Footer } from '@/components/footer'
import { Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { AnimatedBroadcastSvg } from '@/components/animated-broadcast-svg'
import { wwwPath } from '@/lib/site-urls'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'À propos de Scoop Afrique',
  description:
    'Scoop Afrique — média fondé en 2025 à Abidjan. +1,4 M abonnés cumulés (mars 2026). Mission, équipe, vision et lien vers le site de lecture.',
  alternates: { canonical: `${BASE_URL}/a-propos` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/a-propos`,
    title: 'À propos de Scoop Afrique',
    description: 'Média panafricain : audience 2026, équipe, vision.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/images/hero-brands.png`, width: 1200, height: 630, alt: 'Scoop Afrique' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'À propos de Scoop Afrique',
    description: 'Média panafricain — chiffres 2026 & équipe.',
    images: ['/images/hero-brands.png'],
  },
}

const stats = [
  { value: '+1,4 M', label: 'Abonnés cumulés' },
  { value: '910 K', label: 'TikTok' },
  { value: '410 K', label: 'Facebook (monétisé)' },
  { value: '12+', label: 'Pays' },
]

const team = [
  { name: 'Armel', role: 'Fondateur & directeur éditorial', focus: 'Vision éditoriale, contenus, tournages' },
  { name: 'Inès Metsebo', role: 'Co-fondatrice & investisseure', focus: 'Stratégie, finance, réseaux Europe' },
  { name: 'Jordan Ngucho', role: 'Directeur stratégie & opérations', focus: 'Business, organisation, CRM, croissance' },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative h-[40vh] min-h-[280px] w-full overflow-hidden border-b border-[var(--surface-border)] sm:h-[50vh]">
        <Image
          src="/images/hero-brands.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero-overlay)' }} aria-hidden />
        <div className="absolute inset-0 flex items-end p-6 sm:p-8 md:p-12">
          <h1 className="font-sans text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl">
            À propos de <span className="text-primary">Scoop Afrique</span>
          </h1>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:px-12 md:py-16 lg:px-20">
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Dot size="sm" className="text-primary" />
            Notre histoire
          </div>
          <div className="mb-6 flex justify-center sm:justify-start">
            <AnimatedBroadcastSvg />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Scoop Afrique est né à <strong className="text-foreground">Abidjan en 2025</strong> d’une idée simple : offrir à
            la jeunesse africaine francophone un média rapide, créatif et ancré dans le réel — loin des discours lissés.
            Aujourd’hui, nous comptons plus de{' '}
            <strong className="text-foreground">1,4 million d’abonnés cumulés</strong> sur l’ensemble de nos comptes, avec
            une présence particulièrement forte sur TikTok et Facebook (chiffres mars 2026, analytics internes — identiques
            à notre media kit).
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Nous produisons des formats courts et longs : interviews, micro-trottoirs, couvertures live, jeux avec des
            personnalités, reportages terrain. Côté marques, la même équipe assure la continuité entre ce que vous voyez
            sur le <Link href={wwwPath('/')} className="text-primary underline-offset-4 hover:underline">site de lecture</Link>
            {' '}et les offres présentées sur l’
            <Link href="/" className="text-primary underline-offset-4 hover:underline">espace partenaires</Link>.
          </p>
        </div>

        <h2 className="mb-4 font-sans text-base font-semibold uppercase tracking-wider text-foreground">Chiffres clés</h2>
        <p className="mb-6 text-xs text-muted-foreground">
          Mars 2026 · sources : analytics internes plateformes (reprises dans notre media kit public).
        </p>
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 text-center">
              <div className="font-sans text-lg font-bold text-primary sm:text-xl">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        <h2 className="mb-4 font-sans text-base font-semibold uppercase tracking-wider text-foreground">Vision & mission</h2>
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
              Donner une voix et une vitrine à l’Afrique avec des contenus audiovisuels honnêtes, modernes et utiles au
              débat.
            </p>
          </Card>
        </div>

        <h2 className="mb-4 font-sans text-base font-semibold uppercase tracking-wider text-foreground">Équipe & gouvernance</h2>
        <ul className="mb-12 space-y-4">
          {team.map((m) => (
            <li key={m.name}>
              <Card className="border-[var(--surface-border)] p-4">
                <p className="font-sans text-sm font-bold text-foreground">{m.name}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">{m.role}</p>
                <p className="mt-1 text-sm text-muted-foreground">{m.focus}</p>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mb-12 text-sm text-muted-foreground">
          L’équipe s’appuie également sur des profils production, social media et journalisme (stages et alternance selon
          les périodes).
        </p>

        <h2 className="mb-4 font-sans text-base font-semibold uppercase tracking-wider text-foreground">Siège & mentions</h2>
        <p className="mb-2 text-sm text-muted-foreground">
          Abidjan, Cocody Riviera Faya — 01 BP 130 Abidjan 01, Côte d&apos;Ivoire.
        </p>
        <p className="mb-8 text-xs text-muted-foreground">RCCM CI-ABJ-03-2025-B12058-06 — SCOOP AFRIQUE SARL</p>

        <h2 className="mb-4 font-sans text-base font-semibold uppercase tracking-wider text-foreground">Rubriques & ton</h2>
        <ul className="mb-12 list-none space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Actualité & société</strong> — décryptage accessible, terrain, opinion.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Culture & divertissement</strong> — musique, événements, formats viraux.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Économie & innovation</strong> — portraits, actu expliquée, audience pro.
            </span>
          </li>
        </ul>

        <Card className="border-primary/20 bg-primary/5 p-6 text-center sm:p-8">
          <h2 className="mb-3 font-sans text-base font-semibold uppercase tracking-wider text-foreground">
            Lire le média ou passer à l’action
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Articles, vidéos et newsletters sur le site public ; offres annonceurs, tarifs et brief sur cet espace.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <CtaButton href={wwwPath('/')} variant="outline" external>
              scoop-afrique.com
            </CtaButton>
            <CtaButton href="/strategie-editoriale" variant="outline">
              Stratégie éditoriale
            </CtaButton>
            <CtaButton href="/demander-devis" variant="fillHover">
              Demander un devis
            </CtaButton>
          </div>
        </Card>
      </article>
      <Footer />
    </main>
  )
}
