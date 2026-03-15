import type { Metadata } from 'next'
import { Footer } from '@/components/footer'
import { Heading, Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Questions fréquentes sur Scoop Afrique : partenariats, tarifs, couverture événementielle, publication, interview. Réponses à vos questions.',
  alternates: { canonical: `${BASE_URL}/faq` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/faq`,
    title: 'FAQ | Scoop Afrique',
    description: 'Questions fréquentes sur nos services B2B.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique FAQ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | Scoop Afrique',
    description: 'Questions fréquentes sur nos services B2B.',
    images: ['/og-image.png'],
  },
}

const faqs = [
  {
    q: 'Quels sont vos tarifs ?',
    a: 'Nos tarifs varient selon le service : publication (50K–75K FCFA), couverture événementielle (150K–750K FCFA), promo concert (150K–600K FCFA), interview (150K FCFA), partenariat de marque (1 500K FCFA/mois). Ces montants sont indicatifs ; un devis personnalisé est établi sur demande.',
  },
  {
    q: 'Sur quelles plateformes diffusez-vous ?',
    a: 'Nous diffusons sur TikTok, Instagram, Facebook, YouTube et Threads. Notre audience cumulée dépasse 1,25 million d\'abonnés avec plus de 300 millions de vues.',
  },
  {
    q: 'Comment demander un devis ?',
    a: 'Utilisez notre formulaire de demande de devis en ligne ou envoyez un email à contact@scoop-afrique.com en précisant votre projet (type de service, objectifs, budget indicatif). Nous répondons sous 24 à 48h.',
  },
  {
    q: 'Quelle est la différence entre couverture Classique et Gold+ ?',
    a: 'Classique : présence sur place, captage ambiance, recap sur nos réseaux. Gold+ : équipe complète, tapis rouge, interviews personnalités, vlog YouTube dédié, contenu exclusif multi-plateformes.',
  },
  {
    q: 'Proposez-vous des partenariats long terme ?',
    a: 'Oui. Notre offre Partenariat de marque inclut 2 posts + 2 stories/semaine sur tous nos réseaux, contenu permanent et liens officiels, à partir de 1 500 000 FCFA/mois.',
  },
  {
    q: 'Où êtes-vous basés ?',
    a: 'Notre siège est à Abidjan, Cocody Riviera Faya — Côte d\'Ivoire. Nous couvrons des événements dans plus de 12 pays africains.',
  },
  {
    q: 'Comment fonctionne la publication sponsorisée ?',
    a: 'Nous publions votre contenu (annonce, communiqué, visuel) sur nos réseaux. Formule Classique : 1 post multi-plateformes. Formule Premium : Post + Stories + article. Tarifs : 50K–75K FCFA.',
  },
  {
    q: 'Quel délai pour une réponse ?',
    a: 'Nous nous engageons à répondre sous 24 à 48 heures ouvrées. Pour les demandes urgentes, précisez-le dans votre message.',
  },
]

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Dot size="sm" className="text-primary" />
          Questions fréquentes
        </div>
        <Heading as="h1" level="h1" className="mb-4">
          <span className="text-primary">FAQ</span>
        </Heading>
        <p className="mb-16 text-xl text-muted-foreground">
          Réponses aux questions les plus fréquentes sur nos services, tarifs et partenariats.
        </p>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <Card key={i} className="border-border p-6">
              <h2 className="mb-3 font-sans text-lg font-bold uppercase tracking-wider text-foreground">
                {faq.q}
              </h2>
              <p className="text-muted-foreground">{faq.a}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-16 border-primary/20 bg-primary/5 p-8 text-center">
          <Heading as="h2" level="h2" className="mb-4">
            Une autre question ?
          </Heading>
          <p className="mb-6 text-muted-foreground">
            Contactez-nous pour toute demande personnalisée.
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
