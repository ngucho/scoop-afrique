import type { Metadata } from 'next'
import { Mail, MapPin, Clock, Send } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Heading, Card } from 'scoop'
import { CtaButton } from '@/components/cta-button'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Contact',
  description: "Contactez l'equipe Scoop Afrique. Partenariats, publicite, presse ou simplement pour nous dire bonjour.",
  alternates: { canonical: `${BASE_URL}/contact` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/contact`,
    title: 'Contactez Scoop Afrique',
    description: "Contactez l'equipe Scoop Afrique. Partenariats, publicite, presse.",
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contactez Scoop Afrique',
    description: "Contactez l'equipe Scoop Afrique. Partenariats, publicite, presse.",
    images: ['/og-image.png'],
  },
}

const contactInfo = [
  { icon: Mail, title: 'Email', value: 'contact@scoop-afrique.com', href: 'mailto:contact@scoop-afrique.com' as string | null },
  { icon: MapPin, title: 'Siege social', value: "Abidjan, Cocody Riviera Faya - 01 BP 130 Abidjan 01, Cote d'Ivoire", href: null },
  { icon: Clock, title: 'Temps de reponse', value: 'Sous 24-48h', href: null },
]

const departments = [
  { title: 'Partenariats & Publicite', description: 'Collaborations commerciales, sponsorings, campagnes digitales et placements de produits.', email: 'contact@scoop-afrique.com', subject: 'Partenariat / Publicite' },
  { title: 'Couverture & Video', description: 'Couverture evenementielle, reportages et contenus video. Devis sur demande.', email: 'contact@scoop-afrique.com', subject: 'Couverture mediatique / Video' },
  { title: 'Interviews & Reportage', description: 'Interviews, promotion artiste, partenariat de marque.', email: 'contact@scoop-afrique.com', subject: 'Interview / Reportage' },
  { title: 'Publication & Presse', description: 'Publications sponsorisees, packs et formats premium selon objectif.', email: 'contact@scoop-afrique.com', subject: 'Publication / Presse' },
  { title: 'Support', description: 'Signalement technique ou question generale.', email: 'contact@scoop-afrique.com', subject: 'Support' },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-4xl px-4 py-14 sm:px-8 sm:py-16">
        <Heading as="h1" level="h1" className="mb-4 break-words">
          Contactez <span className="text-primary">Scoop Afrique</span>
        </Heading>
        <p className="mb-12 text-lg text-muted-foreground sm:text-xl">Une question ? Une proposition ? Nous sommes a l&apos;ecoute.</p>

        <div className="mb-16 grid gap-4 md:grid-cols-3 md:gap-6">
          {contactInfo.map((info) => (
            <Card key={info.title} className="min-w-0 p-5 sm:p-6">
              <info.icon className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-1 break-words font-bold">{info.title}</h3>
              {info.href ? (
                <a href={info.href} className="break-all text-muted-foreground transition-colors hover:text-primary">
                  {info.value}
                </a>
              ) : (
                <p className="break-words text-muted-foreground">{info.value}</p>
              )}
            </Card>
          ))}
        </div>

        <Heading as="h2" level="h2" className="mb-8 break-words">
          Departements
        </Heading>
        <div className="mb-16 space-y-5 sm:space-y-6">
          {departments.map((dept) => (
            <Card key={dept.title} className="flex min-w-0 flex-col justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
              <div className="min-w-0">
                <h3 className="mb-1 break-words font-bold">{dept.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{dept.description}</p>
              </div>
              <CtaButton
                href={`mailto:${dept.email}?subject=${encodeURIComponent(dept.subject)}`}
                variant="fillHover"
                className="w-full shrink-0 justify-center gap-2 sm:w-auto"
              >
                <Send className="h-4 w-4" />
                Contacter
              </CtaButton>
            </Card>
          ))}
        </div>

        <Card className="border-primary/20 bg-primary/5 p-5 text-center sm:p-8">
          <Heading as="h2" level="h2" className="mb-4 break-words">
            Suivez-nous
          </Heading>
          <p className="mb-6 text-muted-foreground">Pour les reponses rapides, contactez-nous sur nos reseaux sociaux.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <CtaButton href="https://www.tiktok.com/@Scoop.Afrique" variant="outline" external className="w-full justify-center sm:w-auto">TikTok</CtaButton>
            <CtaButton href="https://www.instagram.com/Scoop.Afrique" variant="outline" external className="w-full justify-center sm:w-auto">Instagram</CtaButton>
            <CtaButton href="https://www.facebook.com/profile.php?id=61568464568442" variant="outline" external className="w-full justify-center sm:w-auto">Facebook</CtaButton>
          </div>
        </Card>
      </article>
      <Footer />
    </main>
  )
}
