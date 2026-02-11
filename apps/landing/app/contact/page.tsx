import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail, MapPin, Clock, Send } from 'lucide-react'
import { Footer } from '@/components/footer'
import { ContactLeadForm } from '@/components/contact-lead-form'
import { Heading, Card } from 'scoop'
import { backLinkClassName, buttonDefaultClassName, buttonOutlineClassName } from '@/lib/landing'

const BASE_URL = 'https://www.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    "Contactez l'équipe Scoop Afrique. Partenariats, publicité, presse ou simplement pour nous dire bonjour.",
  alternates: { canonical: `${BASE_URL}/contact` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/contact`,
    title: 'Contactez Scoop Afrique',
    description: "Contactez l'équipe Scoop Afrique. Partenariats, publicité, presse.",
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contactez Scoop Afrique',
    description: "Contactez l'équipe Scoop Afrique. Partenariats, publicité, presse.",
  },
}

const contactInfo = [
  { icon: Mail, title: 'Email', value: 'Contact@scoop-afrique.com', href: 'mailto:Contact@scoop-afrique.com' as string | null },
  { icon: MapPin, title: 'Siège social', value: "Abidjan, Cocody Riviera Faya — 01 BP 130 Abidjan 01, Côte d'Ivoire", href: null },
  { icon: Clock, title: 'Temps de reponse', value: 'Sous 24-48h', href: null },
]

const departments = [
  { title: 'Partenariats & Publicité', description: 'Collaborations commerciales, sponsorings, campagnes digitales et placements de produits.', email: 'Contact@scoop-afrique.com', subject: 'Partenariat / Publicité' },
  { title: 'Couverture & Vidéo', description: 'Couverture événementielle, reportages et contenus vidéo. Devis sur demande.', email: 'Contact@scoop-afrique.com', subject: 'Couverture médiatique / Vidéo' },
  { title: 'Interviews & Podcast', description: 'Interviews, promotion artiste, partenariat de marque.', email: 'Scoopmagco@gmail.com', subject: 'Interview / Podcast' },
  { title: 'Rédaction & Presse', description: "Communiqués de presse, propositions d'articles et informations.", email: 'Contact@scoop-afrique.com', subject: 'Presse' },
  { title: 'Support', description: 'Signalement technique ou question générale.', email: 'Contact@scoop-afrique.com', subject: 'Support' },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link href="/" className={backLinkClassName}>
            <span aria-hidden />
            <ArrowLeft className="mr-2 inline-block h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-4xl px-6 py-16">
        <Heading as="h1" level="h1" className="mb-4">
          Contactez <span className="text-primary">Scoop Afrique</span>
        </Heading>
        <p className="mb-12 text-xl text-muted-foreground">Une question ? Une proposition ? Nous sommes à l&apos;écoute.</p>
        <div className="mb-16 grid gap-6 md:grid-cols-3">
          {contactInfo.map((info) => (
            <Card key={info.title} className="p-6">
              <info.icon className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-1 font-bold">{info.title}</h3>
              {info.href ? (
                <a href={info.href} className="text-muted-foreground transition-colors hover:text-primary">{info.value}</a>
              ) : (
                <p className="text-muted-foreground">{info.value}</p>
              )}
            </Card>
          ))}
        </div>
        <Heading as="h2" level="h2" className="mb-8">Départements</Heading>
        <div className="mb-16 space-y-6">
          {departments.map((dept) => (
            <Card key={dept.title} className="flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
              <div>
                <h3 className="mb-1 font-bold">{dept.title}</h3>
                <p className="text-sm text-muted-foreground">{dept.description}</p>
              </div>
              <a
                href={`mailto:${dept.email}?subject=${encodeURIComponent(dept.subject)}`}
                className={`${buttonDefaultClassName} shrink-0 gap-2`}
              >
                <Send className="h-4 w-4" />
                Contacter
              </a>
            </Card>
          ))}
        </div>
        <Card className="border-primary/20 bg-primary/5 p-8 text-center">
          <Heading as="h2" level="h2" className="mb-4">Suivez-nous</Heading>
          <p className="mb-6 text-muted-foreground">Pour les réponses rapides, contactez-nous sur nos réseaux sociaux.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://www.tiktok.com/@Scoop.Afrique" target="_blank" rel="noopener noreferrer" className={buttonOutlineClassName}>TikTok</a>
            <a href="https://www.instagram.com/Scoop.Afrique" target="_blank" rel="noopener noreferrer" className={buttonOutlineClassName}>Instagram</a>
            <a href="https://www.facebook.com/profile.php?id=61568464568442" target="_blank" rel="noopener noreferrer" className={buttonOutlineClassName}>Facebook</a>
          </div>
        </Card>
      </article>
      <Footer />
    </main>
  )
}
