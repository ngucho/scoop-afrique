import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Users, Eye, Globe, Heart } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ReaderFooter } from '@/components/reader/ReaderFooter'
import { Heading, Card } from 'scoop'

export const metadata: Metadata = {
  title: 'À propos de Scoop Afrique',
  description:
    "Découvrez Scoop Afrique, le média digital africain. Notre mission, notre vision et notre équipe pour l'Afrique.",
}

const backLinkClass =
  'inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary'

const stats = [
  { icon: Users, value: '1.25M+', label: 'Abonnés' },
  { icon: Eye, value: '490M+', label: 'Vues' },
  { icon: Globe, value: '12+', label: 'Pays touchés' },
  { icon: Heart, value: '50M+', label: 'Interactions' },
]

export default function AboutPage() {
  return (
    <ReaderLayout>
      <main className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <Link href="/" className={backLinkClass}>
              <ArrowLeft className="h-4 w-4" />
              Retour à l&apos;accueil
            </Link>
          </div>
        </header>
        <article className="mx-auto max-w-4xl px-6 py-16">
          <Heading as="h1" level="h1" className="mb-8">
            À propos de <span className="text-primary">Scoop Afrique</span>
          </Heading>
          <p className="text-xl text-muted-foreground">
            <strong>Scoop Afrique</strong> est un média panafricain basé en Côte d&apos;Ivoire qui allie rapidité,
            fiabilité et créativité dans le traitement de l&apos;information. Avec plus de 300 millions de vues sur nos
            réseaux sociaux, nous faisons partie des nouvelles voix médiatiques les plus influentes du continent.
          </p>
          <Heading as="h2" level="h2" className="mt-12">
            Notre vision
          </Heading>
          <p className="mt-2 text-foreground">
            Devenir un acteur majeur de l&apos;information en Afrique, en mettant en lumière les initiatives locales
            et en connectant les jeunes générations à une actualité moderne et inspirante.
          </p>
          <Heading as="h2" level="h2" className="mt-12">
            Notre mission
          </Heading>
          <p className="mt-2 text-foreground">
            Nous croyons que l&apos;Afrique mérite un média à son image : moderne, audacieux, authentique. Raconter
            les histoires qui comptent, célébrer notre culture, et informer sans compromettre notre identité.
          </p>
          <Heading as="h2" level="h2" className="mt-12">
            Siège
          </Heading>
          <p className="mt-2 text-muted-foreground">
            Abidjan, Cocody Riviera Faya — 01 BP 130 Abidjan 01, Côte d&apos;Ivoire.
          </p>
          <Heading as="h2" level="h2" className="mt-12">
            Ce qui nous rend uniques
          </Heading>
          <ul className="mt-2 list-none space-y-1 text-foreground">
            <li>
              <strong>100% Digital, 100% Africain</strong> — Créé en Côte d&apos;Ivoire, pour l&apos;Afrique et le monde
            </li>
            <li>
              <strong>Ton éditorial distinctif</strong> — Zen, ferme, confiant, ambitieux
            </li>
            <li>
              <strong>Contenus viraux</strong> — Des formats adaptés aux réseaux sociaux modernes
            </li>
            <li>
              <strong>Engagement réel</strong> — Une communauté active et passionnée
            </li>
          </ul>
          <Heading as="h2" level="h2" className="mt-12">
            Nos rubriques
          </Heading>
          <ul className="mt-2 list-none space-y-1 text-foreground">
            <li>
              <strong>Actualité internationale</strong> — Les news qui impactent l&apos;Afrique
            </li>
            <li>
              <strong>Pop culture</strong> — Musique, cinéma, mode, art
            </li>
            <li>
              <strong>Sport</strong> — Football, basketball, et les athlètes africains
            </li>
            <li>
              <strong>Politique</strong> — Décryptage des enjeux du continent
            </li>
            <li>
              <strong>Économie</strong> — Business, tech, entrepreneuriat africain
            </li>
            <li>
              <strong>Divertissement</strong> — Buzz, tendances, lifestyle africain
            </li>
          </ul>
          <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6 text-center">
                <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
          <Card className="mt-16 p-8 text-center">
            <Heading as="h2" level="h2" className="mb-4">
              Rejoignez la communauté
            </Heading>
            <p className="mb-6 text-muted-foreground">
              Suivez-nous sur les réseaux sociaux pour ne rien manquer de l&apos;actualité.
            </p>
            <Link href="/" className="inline-flex items-center justify-center rounded-md border-2 border-primary bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:opacity-90">
              Découvrir nos réseaux
            </Link>
          </Card>
        </article>
      </main>
    </ReaderLayout>
  )
}
