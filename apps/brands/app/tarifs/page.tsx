import type { Metadata } from 'next'
import { FileText, Video, Music, Handshake, Mic2 } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Heading, Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Tarifs & Devis',
  description:
    'Tarifs indicatifs Scoop Afrique : publication, couverture événementielle, promo concert, interview, partenariat de marque. Devis personnalisé sur demande.',
  alternates: { canonical: `${BASE_URL}/tarifs` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/tarifs`,
    title: 'Tarifs & Devis | Scoop Afrique',
    description: 'Tarifs indicatifs pour nos services B2B. Devis personnalisé sur demande.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique Tarifs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs | Scoop Afrique',
    description: 'Tarifs indicatifs pour nos services B2B. Devis personnalisé sur demande.',
    images: ['/og-image.png'],
  },
}

const tarifs = [
  {
    icon: FileText,
    title: 'Publication',
    description: '1 publication sur tous nos réseaux (Classique) ou Post + Stories + article (Premium).',
    price: '50K – 75K FCFA',
    details: ['Classique : 1 post multi-plateformes', 'Premium : Post + Stories + article'],
  },
  {
    icon: Video,
    title: 'Couverture événementielle',
    description: 'Présence, captage ambiance, Recap. Formules Classique à Gold+ avec vlog YouTube.',
    price: '150K – 750K FCFA',
    details: ['Classique : 150K', 'Premium : 300K', 'Gold : 600K', 'Gold+ : 750K'],
  },
  {
    icon: Music,
    title: 'Promo concert / événement',
    description: 'Annonce, post rappel, micro trottoir. Pack complet J-J disponible.',
    price: '150K – 600K FCFA',
    details: ['Pack annonce', 'Pack rappel', 'Pack complet J-J'],
  },
  {
    icon: Mic2,
    title: 'Interview / Reportage',
    description: 'Format standard diffusé sur nos réseaux. Idéal pour lancement, personnalité.',
    price: '150K FCFA',
    details: ['Format standard', 'Diffusion multi-plateformes'],
  },
  {
    icon: Handshake,
    title: 'Partenariat de marque',
    description: '2 posts + 2 stories/semaine sur tous nos réseaux. Contenu permanent, liens officiels.',
    price: '1 500K FCFA / mois',
    details: ['Contenu permanent', 'Liens officiels', 'Suivi dédié'],
  },
]

export default function TarifsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Dot size="sm" className="text-primary" />
          Tarifs indicatifs
        </div>
        <Heading as="h1" level="h1" className="mb-4">
          Nos <span className="text-primary">tarifs</span>
        </Heading>
        <p className="mb-16 text-xl text-muted-foreground">
          Tarifs indicatifs pour nos services B2B. Chaque projet est unique : demandez un devis personnalisé pour une offre adaptée à vos objectifs.
        </p>

        <div className="space-y-8">
          {tarifs.map((tarif) => (
            <Card key={tarif.title} className="overflow-hidden border-border p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <tarif.icon className="h-10 w-10 shrink-0 text-primary" />
                  <div>
                    <h2 className="font-sans text-xl font-bold uppercase tracking-wider text-foreground">
                      {tarif.title}
                    </h2>
                    <p className="mt-1 text-muted-foreground">{tarif.description}</p>
                    <ul className="mt-3 list-none space-y-1 text-sm text-muted-foreground">
                      {tarif.details.map((d) => (
                        <li key={d} className="flex items-center gap-2">
                          <Dot size="sm" className="shrink-0 text-primary" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="shrink-0 font-sans text-2xl font-black text-primary md:text-right">
                  {tarif.price}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-16 border-primary/20 bg-primary/5 p-8 text-center">
          <Heading as="h2" level="h2" className="mb-4">
            Devis personnalisé
          </Heading>
          <p className="mb-6 text-muted-foreground">
            Chaque projet est unique. Contactez-nous pour une offre sur mesure adaptée à vos objectifs et à votre budget.
          </p>
          <CtaButton href="/demander-devis" variant="fillHover">
            Demander un devis
          </CtaButton>
        </Card>
      </article>

      <Footer />
    </main>
  )
}
