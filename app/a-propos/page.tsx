import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Users, Eye, Globe, Heart } from 'lucide-react'
import { Footer } from '@/components/footer'

const BASE_URL = 'https://scoop-afrique.com'

export const metadata: Metadata = {
  title: 'A Propos de Scoop Afrique',
  description: 'Découvrez Scoop Afrique, le média digital africain nouvelle génération. Notre mission, notre équipe et notre vision pour l\'Afrique.',
  alternates: {
    canonical: `${BASE_URL}/a-propos`,
  },
  openGraph: {
    type: 'website',  
    url: `${BASE_URL}/a-propos`,
    title: 'A Propos de Scoop Afrique',
    description: 'Découvrez Scoop Afrique, le média digital africain nouvelle génération. Notre mission, notre équipe et notre vision pour l\'Afrique.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A Propos de Scoop Afrique',
    description: 'Découvrez Scoop Afrique, le média digital africain nouvelle génération.',
  },
}

const stats = [
  { icon: Users, value: '1.25M+', label: 'Abonnés' },
  { icon: Eye, value: '490M+', label: 'Vues' },
  { icon: Globe, value: '25+', label: 'Pays touchés' },
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
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-8 text-4xl font-bold tracking-tight md:text-5xl">
          A Propos de <span className="text-primary">Scoop Afrique</span>
        </h1>

        <div className="prose prose-lg prose-invert max-w-none">
          <p className="lead text-xl text-muted-foreground">
            <strong>Scoop Afrique</strong> est un media digital 100% ivoirien 
            qui décrypte l&apos;actualité africaine et internationale pour une audience jeune, 
            connectée et ambitieuse.
          </p>

          <h2 className="mt-12 text-2xl font-bold">Notre Mission</h2>
          <p>
            Nous croyons que l&apos;Afrique merite un média à son image : moderne, audacieux, 
            authentique. Notre mission est de raconter les histoires qui comptent, 
            de célébrer notre culture, et d&apos;informer sans compromettre notre identité.
          </p>

          <h2 className="mt-12 text-2xl font-bold">Ce Qui Nous Rend Uniques</h2>
          <ul>
            <li><strong>100% Digital, 100% Africain</strong> - Cree en Cote d&apos;Ivoire, pour l&apos;Afrique et le monde</li>
            <li><strong>Ton Editorial Distinctif</strong> - Zen, ferme, confiant, ambitieux</li>
            <li><strong>Contenus Viraux</strong> - Des formats adaptés aux réseaux sociaux modernes</li>
            <li><strong>Engagement Réel</strong> - Une communauté active et passionnée</li>
          </ul>

          <h2 className="mt-12 text-2xl font-bold">Nos Rubriques</h2>
          <ul>
            <li><strong>Actualité Internationale</strong> - Les news qui impactent l&apos;Afrique</li>
            <li><strong>Pop Culture</strong> - Musique, cinéma, mode, art</li>
            <li><strong>Sport</strong> - Football, basketball, et les athletes africains</li>
            <li><strong>Politique</strong> - Décryptage des enjeux du continent</li>
            <li><strong>Economie</strong> - Business, tech, entrepreneuriat africain</li>
            <li><strong>Divertissement</strong> - Buzz, tendances, lifestyle africain</li>
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
          <h2 className="mb-4 text-2xl font-bold">Rejoignez la Communauté</h2>
          <p className="mb-6 text-muted-foreground">
            Suivez-nous sur les réseaux sociaux pour ne rien manquer de l&apos;actualité.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center rounded-none bg-primary px-8 py-3 font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            Découvrir Nos Réseaux
          </Link>
        </div>
      </article>

      <Footer />
    </main>
  )
}
