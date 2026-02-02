import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail, MapPin, Clock, Send } from 'lucide-react'
import { Footer } from '@/components/footer'

const BASE_URL = 'https://scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l&apos;équipe Scoop Afrique. Partenariats, publicité, presse ou simplement pour nous dire bonjour.',
  alternates: {
    canonical: `${BASE_URL}/contact`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/contact`,
    title: 'Contactez Scoop Afrique',
    description: 'Contactez l&apos;équipe Scoop Afrique. Partenariats, publicité, presse ou simplement pour nous dire bonjour.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contactez Scoop Afrique',
    description: 'Contactez l&apos;équipe Scoop Afrique. Partenariats, publicité, presse.',
  },
}

const contactInfo = [
  {
    icon: Mail,
    title: 'Email',
    value: 'Contact@scoop-afrique.com',
    href: 'mailto:Contact@scoop-afrique.com',
  },
  {
    icon: MapPin,
    title: 'Localisation',
    value: 'Abidjan, Côte d&apos;Ivoire',
    href: null,
  },
  {
    icon: Clock,
    title: 'Temps de reponse',
    value: 'Sous 24-48h',
    href: null,
  },
]

const departments = [
  {
    title: 'Partenariats & Publicité',
    description: 'Pour les collaborations commerciales, sponsorings et placements de produits.',
    email: 'Contact@scoop-afrique.com',
    subject: 'Partenariat',
  },
  {
    title: 'Redaction & Presse',
    description: 'Pour les communiques de presse, propositions d&apos;articles et informations.',
    email: 'Contact@scoop-afrique.com',
    subject: 'Presse',
  },
  {
    title: 'Support Technique',
    description: 'Pour signaler un problème technique ou une erreur sur le site.',
    email: 'Contact@scoop-afrique.com',
    subject: 'Support Technique',
  },
]

export default function ContactPage() {
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
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Contactez <span className="text-primary">Scoop Afrique</span>
        </h1>
        <p className="mb-12 text-xl text-muted-foreground">
          Une question ? Une proposition ? Nous sommes à l&apos;écoute.
        </p>

        {/* Contact Info Cards */}
        <div className="mb-16 grid gap-6 md:grid-cols-3">
          {contactInfo.map((info) => (
            <div 
              key={info.title}
              className="rounded-lg border border-border bg-card p-6"
            >
              <info.icon className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-1 font-bold">{info.title}</h3>
              {info.href ? (
                <a 
                  href={info.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {info.value}
                </a>
              ) : (
                <p className="text-muted-foreground">{info.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Departments */}
        <h2 className="mb-8 text-2xl font-bold">Départements</h2>
        <div className="mb-16 space-y-6">
          {departments.map((dept) => (
            <div 
              key={dept.title}
              className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-6 md:flex-row md:items-center"
            >
              <div>
                <h3 className="mb-1 font-bold">{dept.title}</h3>
                <p className="text-sm text-muted-foreground">{dept.description}</p>
              </div>
              <a
                href={`mailto:${dept.email}?subject=${encodeURIComponent(dept.subject)}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 font-bold text-primary-foreground transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
                Contacter
              </a>
            </div>
          ))}
        </div>

        {/* Social Links */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Suivez-nous</h2>
          <p className="mb-6 text-muted-foreground">
            Pour les réponses rapides, contactez-nous sur nos réseaux sociaux.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://www.tiktok.com/@Scoop.Afrique"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-none border border-border bg-card px-6 py-3 font-bold transition-colors hover:border-primary hover:text-primary"
            >
              TikTok
            </a>
            <a
              href="https://www.instagram.com/Scoop.Afrique"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-none border border-border bg-card px-6 py-3 font-bold transition-colors hover:border-primary hover:text-primary"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/scoop.afrique"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-none border border-border bg-card px-6 py-3 font-bold transition-colors hover:border-primary hover:text-primary"
            >
              Facebook
            </a>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
