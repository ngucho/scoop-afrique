import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Users, Eye, Globe, Heart } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { Heading, SectionHeader } from 'scoop'

export const metadata: Metadata = {
  title: 'À propos — Scoop Afrique',
  description:
    "Scoop Afrique, le média panafricain de la jeunesse francophone. Notre mission : décrypter l'Afrique autrement, depuis Abidjan.",
}

const stats = [
  { icon: Users, value: '+1,4 M', label: 'Abonnés cumulés' },
  { icon: Eye, value: '490 M+', label: 'Vues totales' },
  { icon: Globe, value: '12+', label: 'Pays touchés' },
  { icon: Heart, value: '50 M+', label: 'Interactions' },
]

const uniqueness = [
  { title: '100 % Digital, 100 % Africain', body: 'Né en Côte d\'Ivoire, pensé pour l\'Afrique et le monde. Chaque format, chaque sujet, chaque angle est conçu pour résonner avec la réalité du continent.' },
  { title: 'Un ton éditorial distinctif', body: 'Zen, ferme, confiant, ambitieux. On ne crie pas — on décrypte. On ne suit pas la tendance — on la devance.' },
  { title: 'Formats taillés pour le mobile', body: 'Couvertures live, micro-trottoirs, jeux avec des personnalités, interviews, reportages : des formats qui performent sur TikTok, Instagram, YouTube et Facebook.' },
  { title: 'Une communauté active', body: 'Plus d\'un million d\'abonnés qui s\'engagent, commentent et partagent. La Tribune Scoop donne la parole à notre communauté directement sur le site.' },
]

const rubriques = [
  { name: 'Actualité', desc: "Les faits qui façonnent l'Afrique et le monde." },
  { name: 'Politique', desc: 'Décryptage des enjeux de gouvernance et de pouvoir.' },
  { name: 'Culture', desc: 'Musique, cinéma, mode, art — la créativité africaine à l\'honneur.' },
  { name: 'Sport', desc: 'Football, basketball et les athlètes qui font briller le continent.' },
  { name: 'Économie', desc: 'Business, tech et entrepreneuriat africain en plein essor.' },
  { name: 'Société', desc: 'Buzz, tendances et lifestyle — le pouls de la jeunesse.' },
]

export default function AboutPage() {
  return (
    <ReaderLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>

        {/* Hero section */}
        <header className="mb-16 border-b border-border pb-12">
          <SectionHeader label="À propos" variant="editorial" className="mb-5" />
          <Heading
            as="h1"
            level="h1"
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Décrypter l&apos;Afrique{' '}
            <span className="text-primary">autrement</span>
          </Heading>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            <strong className="font-semibold text-foreground">Scoop Afrique</strong> est un média panafricain basé en
            Côte d&apos;Ivoire. Depuis 2025, nous racontons l&apos;Afrique avec le regard affûté, l&apos;énergie et
            l&apos;ambition de sa jeunesse — sur tous les écrans, dans toutes les langues du numérique.
          </p>
        </header>

        {/* Stats */}
        <section className="mb-16" aria-labelledby="stats-heading">
          <SectionHeader label="En chiffres" variant="editorial" className="mb-8" />
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]"
              >
                <stat.icon className="h-5 w-5 text-primary" aria-hidden />
                <p
                  className="text-3xl font-black leading-none text-primary sm:text-4xl"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  {stat.value}
                </p>
                <p className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="mb-16 grid gap-8 md:grid-cols-2" aria-labelledby="vision-heading">
          <div className="rounded-xl border-l-[3px] border-l-primary bg-card/50 p-6">
            <h2
              className="mb-3 text-xl font-bold text-foreground"
              id="vision-heading"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Notre vision
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Devenir la référence médiatique de la jeunesse africaine — un espace où l&apos;information est précise,
              le ton est authentique, et l&apos;ambition panafricaine n&apos;est pas une posture mais une conviction
              quotidienne.
            </p>
          </div>
          <div className="rounded-xl border-l-[3px] border-l-primary bg-card/50 p-6">
            <h2
              className="mb-3 text-xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Notre mission
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Raconter les histoires qui comptent, célébrer la culture africaine, décrypter les enjeux du continent —
              avec un regard moderne, sans compromis sur notre identité. L&apos;Afrique mérite un média à son image.
            </p>
          </div>
        </section>

        {/* What makes us unique */}
        <section className="mb-16" aria-labelledby="unique-heading">
          <SectionHeader label="Ce qui nous distingue" variant="editorial" className="mb-8" id="unique-heading" />
          <div className="grid gap-4 sm:grid-cols-2">
            {uniqueness.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]"
              >
                <h3 className="mb-2 font-sans text-sm font-bold text-foreground">{item.title}</h3>
                <p className="font-sans text-xs leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Rubriques */}
        <section className="mb-16" aria-labelledby="rubriques-heading">
          <SectionHeader label="Nos rubriques" variant="editorial" className="mb-6" id="rubriques-heading" />
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {rubriques.map((r) => (
              <div key={r.name} className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4">
                <span
                  className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
                <div>
                  <p className="font-sans text-sm font-semibold text-foreground">{r.name}</p>
                  <p className="mt-0.5 font-sans text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Siège */}
        <section className="mb-16">
          <SectionHeader label="Siège social" variant="editorial" className="mb-4" />
          <p className="font-sans text-sm text-muted-foreground">
            Abidjan, Cocody Riviera Faya — 01 BP 130 Abidjan 01, Côte d&apos;Ivoire.
          </p>
        </section>

        {/* CTA */}
        <section className="overflow-hidden rounded-2xl border-l-[6px] border-l-primary bg-muted/50 p-8 md:p-10">
          <h2
            className="mb-3 text-2xl font-bold text-foreground sm:text-3xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Rejoignez la communauté
          </h2>
          <p className="mb-6 max-w-md font-sans text-sm leading-relaxed text-muted-foreground">
            Suivez-nous sur les réseaux, lisez nos articles, participez à la Tribune — faites partie du média africain
            qui décrypte le monde sans complexes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/articles"
              className="inline-flex items-center rounded-full bg-primary px-6 py-3 font-sans text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.97]"
            >
              Lire les articles
            </Link>
            <Link
              href="/newsletter"
              className="inline-flex items-center rounded-full border-2 border-primary bg-transparent px-6 py-3 font-sans text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.97]"
            >
              S&apos;abonner à la newsletter
            </Link>
          </div>
        </section>
      </div>
    </ReaderLayout>
  )
}
