import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Users, Eye, Globe, Heart } from 'lucide-react'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'A Propos',
  description: 'Decouvrez Scoop.Afrique, le media digital africain nouvelle generation. Notre mission, notre equipe et notre vision pour l\'Afrique.',
  alternates: {
    canonical: '/a-propos',
  },
  openGraph: {
    title: 'A Propos de Scoop.Afrique',
    description: 'Decouvrez Scoop.Afrique, le media digital africain nouvelle generation.',
  },
}

const stats = [
  { icon: Users, value: '1.25M+', label: 'Abonnes' },
  { icon: Eye, value: '490M+', label: 'Vues' },
  { icon: Globe, value: '25+', label: 'Pays touches' },
  { icon: Heart, value: '50M+', label: 'Interactions' },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-8 text-4xl font-bold tracking-tight md:text-5xl">
          A Propos de <span className="text-primary">Scoop.Afrique</span>
        </h1>

        <div className="prose prose-lg prose-invert max-w-none">
          <p className="lead text-xl text-muted-foreground">
            <strong>Scoop.Afrique</strong> (avec le point) est un media digital 100% ivoirien 
            qui decrypte l&apos;actualite africaine et internationale pour une audience jeune, 
            connectee et ambitieuse.
          </p>

          <div className="my-12 rounded-lg border border-primary/20 bg-primary/5 p-6">
            <p className="m-0 text-lg font-medium text-primary">
              Le point dans notre nom n&apos;est pas un hasard. Il nous distingue des medias parasites 
              et represente notre engagement pour une information precise et verifiee.
            </p>
          </div>

          <h2 className="mt-12 text-2xl font-bold">Notre Mission</h2>
          <p>
            Nous croyons que l&apos;Afrique merite un media a son image : moderne, audacieux, 
            authentique. Notre mission est de raconter les histoires qui comptent, 
            de celebrer notre culture, et d&apos;informer sans compromettre notre identite.
          </p>

          <h2 className="mt-12 text-2xl font-bold">Ce Qui Nous Rend Uniques</h2>
          <ul>
            <li><strong>100% Digital, 100% Africain</strong> - Cree en Cote d&apos;Ivoire, pour l&apos;Afrique et le monde</li>
            <li><strong>Ton Editorial Distinctif</strong> - Zen, ferme, confiant, ambitieux</li>
            <li><strong>Contenus Viraux</strong> - Des formats adaptes aux reseaux sociaux modernes</li>
            <li><strong>Engagement Reel</strong> - Une communaute active et passionnee</li>
          </ul>

          <h2 className="mt-12 text-2xl font-bold">Nos Rubriques</h2>
          <ul>
            <li><strong>Actualite Internationale</strong> - Les news qui impactent l&apos;Afrique</li>
            <li><strong>Pop Culture</strong> - Musique, cinema, mode, art</li>
            <li><strong>Sport</strong> - Football, basketball, et les athletes africains</li>
            <li><strong>Politique</strong> - Decryptage des enjeux du continent</li>
            <li><strong>Economie</strong> - Business, tech, entrepreneuriat africain</li>
            <li><strong>Divertissement</strong> - Buzz, tendances, lifestyle</li>
          </ul>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="rounded-lg border border-border bg-card p-6 text-center"
            >
              <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Rejoignez la Communaute</h2>
          <p className="mb-6 text-muted-foreground">
            Suivez-nous sur les reseaux sociaux pour ne rien manquer de l&apos;actualite.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center rounded-none bg-primary px-8 py-3 font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            Decouvrir Nos Reseaux
          </Link>
        </div>
      </article>

      <Footer />
    </main>
  )
}
