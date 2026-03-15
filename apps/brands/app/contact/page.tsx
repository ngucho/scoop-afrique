import type { Metadata } from 'next'
import { Mail, MapPin, Clock, Send } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Heading, Card } from 'scoop'
import { CtaButton } from '@/components/cta-button'

const BASE_URL = 'https://brands.scoop-afrique.com'

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
    images: ['/og-image.png'],
  },
}

const contactInfo = [
  { icon: Mail, title: 'Email', value: 'contact@scoop-afrique.com', href: 'mailto:contact@scoop-afrique.com' as string | null },
  { icon: MapPin, title: 'Siège social', value: "Abidjan, Cocody Riviera Faya — 01 BP 130 Abidjan 01, Côte d'Ivoire", href: null },
  { icon: Clock, title: 'Temps de reponse', value: 'Sous 24-48h', href: null },
]

const departments = [
  { title: 'Partenariats & Publicité', description: 'Collaborations commerciales, sponsorings, campagnes digitales et placements de produits.', email: 'contact@scoop-afrique.com', subject: 'Partenariat / Publicité' },
  { title: 'Couverture & Vidéo', description: 'Couverture événementielle, reportages et contenus vidéo. Devis sur demande.', email: 'contact@scoop-afrique.com', subject: 'Couverture médiatique / Vidéo' },
  { title: 'Interviews & Reportage', description: 'Interviews, promotion artiste, partenariat de marque. À partir de 150 000 FCFA.', email: 'contact@scoop-afrique.com', subject: 'Interview / Reportage' },
  { title: 'Publication & Presse', description: "Publication simple (50K–75K FCFA) ou communiqués de presse.", email: 'contact@scoop-afrique.com', subject: 'Publication / Presse' },
  { title: 'Support', description: 'Signalement technique ou question générale.', email: 'contact@scoop-afrique.com', subject: 'Support' },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
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
              <CtaButton
                href={`mailto:${dept.email}?subject=${encodeURIComponent(dept.subject)}`}
                variant="fillHover"
                className="shrink-0 gap-2"
              >
                <Send className="h-4 w-4" />
                Contacter
              </CtaButton>
            </Card>
          ))}
        </div>
        <Card className="border-primary/20 bg-primary/5 p-8 text-center">
          <Heading as="h2" level="h2" className="mb-4">Suivez-nous</Heading>
          <p className="mb-6 text-muted-foreground">Pour les réponses rapides, contactez-nous sur nos réseaux sociaux.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <CtaButton href="https://www.tiktok.com/@Scoop.Afrique" variant="outline" external>TikTok</CtaButton>
            <CtaButton href="https://www.instagram.com/Scoop.Afrique" variant="outline" external>Instagram</CtaButton>
            <CtaButton href="https://www.facebook.com/profile.php?id=61568464568442" variant="outline" external>Facebook</CtaButton>
          </div>
        </Card>
      </article>
      <Footer />
    </main>
  )
}
