import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail, MapPin, Clock, Send } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ReaderFooter } from '@/components/reader/ReaderFooter'
import { ContactLeadForm } from '@/components/ContactLeadForm'
import { Heading, Card } from 'scoop'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    "Contactez l'équipe Scoop Afrique. Partenariats, publicité, presse ou simplement pour nous dire bonjour.",
}

const backLinkClass =
  'inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary'

const contactInfo = [
  { icon: Mail, title: 'Email', value: 'Contact@scoop-afrique.com', href: 'mailto:Contact@scoop-afrique.com' as string | null },
  { icon: MapPin, title: 'Siège social', value: "Abidjan, Cocody Riviera Faya — 01 BP 130 Abidjan 01, Côte d'Ivoire", href: null },
  { icon: Clock, title: 'Temps de réponse', value: 'Sous 24-48h', href: null },
]

const departments = [
  { title: 'Partenariats & Publicité', description: 'Collaborations commerciales, sponsorings, campagnes digitales et placements de produits.', email: 'Contact@scoop-afrique.com', subject: 'Partenariat / Publicité' },
  { title: 'Couverture & Vidéo', description: 'Couverture événementielle, reportages et contenus vidéo. Devis sur demande.', email: 'Contact@scoop-afrique.com', subject: 'Couverture médiatique / Vidéo' },
  { title: 'Interviews & Podcast', description: 'Interviews, promotion artiste, partenariat de marque.', email: 'Scoopmagco@gmail.com', subject: 'Interview / Podcast' },
  { title: 'Rédaction & Presse', description: "Communiqués de presse, propositions d'articles et informations.", email: 'Contact@scoop-afrique.com', subject: 'Presse' },
  { title: 'Support', description: 'Signalement technique ou question générale.', email: 'Contact@scoop-afrique.com', subject: 'Support' },
]

const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-md border-2 border-primary bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:opacity-90'
const btnOutline = 'inline-flex items-center justify-center rounded-md border-2 border-primary bg-transparent px-6 py-3 font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground'

export default function ContactPage() {
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
          <Heading as="h1" level="h1" className="mb-4">
            Contactez <span className="text-primary">Scoop Afrique</span>
          </Heading>
          <p className="mb-12 text-xl text-muted-foreground">
            Une question ? Une proposition ? Nous sommes à l&apos;écoute.
          </p>
          <Heading as="h2" level="h2" className="mb-6">
            Demander un devis ou nous écrire
          </Heading>
          <p className="mb-8 text-muted-foreground">
            Remplissez le formulaire ci-dessous : votre demande sera envoyée par email à notre équipe.
          </p>
          <div className="mb-16">
            <ContactLeadForm />
          </div>
          <div className="mb-16 grid gap-6 md:grid-cols-3">
            {contactInfo.map((info) => (
              <Card key={info.title} className="p-6">
                <info.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-bold">{info.title}</h3>
                {info.href ? (
                  <a href={info.href} className="text-muted-foreground transition-colors hover:text-primary">
                    {info.value}
                  </a>
                ) : (
                  <p className="text-muted-foreground">{info.value}</p>
                )}
              </Card>
            ))}
          </div>
          <Heading as="h2" level="h2" className="mb-8">
            Départements
          </Heading>
          <div className="mb-16 space-y-6">
            {departments.map((dept) => (
              <Card key={dept.title} className="flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
                <div>
                  <h3 className="mb-1 font-bold">{dept.title}</h3>
                  <p className="text-sm text-muted-foreground">{dept.description}</p>
                </div>
                <a href={`mailto:${dept.email}?subject=${encodeURIComponent(dept.subject)}`} className={`${btnPrimary} shrink-0`}>
                  <Send className="h-4 w-4" />
                  Contacter
                </a>
              </Card>
            ))}
          </div>
          <Card className="border-primary/20 bg-primary/5 p-8 text-center">
            <Heading as="h2" level="h2" className="mb-4">
              Suivez-nous
            </Heading>
            <p className="mb-6 text-muted-foreground">
              Pour les réponses rapides, contactez-nous sur nos réseaux sociaux.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://www.tiktok.com/@Scoop.Afrique" target="_blank" rel="noopener noreferrer" className={btnOutline}>
                TikTok
              </a>
              <a href="https://www.instagram.com/Scoop.Afrique" target="_blank" rel="noopener noreferrer" className={btnOutline}>
                Instagram
              </a>
              <a href="https://www.facebook.com/profile.php?id=61568464568442" target="_blank" rel="noopener noreferrer" className={btnOutline}>
                Facebook
              </a>
            </div>
          </Card>
        </article>
      </main>
    </ReaderLayout>
  )
}
