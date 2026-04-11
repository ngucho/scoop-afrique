import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/footer'
import { Heading, Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { wwwPath } from '@/lib/site-urls'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'FAQ Scoop Afrique — partenariats, grille tarifaire 2026, couverture, publications, programmes sponsoring. Réponses basées sur notre media kit.',
  alternates: { canonical: `${BASE_URL}/faq` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/faq`,
    title: 'FAQ | Scoop Afrique',
    description: 'Questions fréquentes — offres B2B & transparence tarifaire.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/images/hero-brands.png`, width: 1200, height: 630, alt: 'Scoop Afrique FAQ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | Scoop Afrique',
    description: 'Questions fréquentes sur nos services B2B.',
    images: ['/images/hero-brands.png'],
  },
}

const faqs = [
  {
    q: 'Quels sont vos tarifs ?',
    a: (
      <>
        Nous appliquons la <strong>grille tarifaire V2 (mars 2026)</strong> en FCFA TTC.{' '}
        <strong>Aucune offre catalogue n’est proposée sous 50 000 FCFA</strong> : l’entrée de gamme est le{' '}
        <strong>post classique multi-plateformes à 50 000 FCFA</strong>. Couverture terrain :{' '}
        <strong>175 000 à 550 000 FCFA</strong> (multi-jours dès 600 000). Publications avec design ou article : jusqu’à{' '}
        <strong>90 000 FCFA</strong>. Promo concert / événement sans terrain : <strong>100 000 à 700 000 FCFA</strong>.
        Interview standard : <strong>150 000 FCFA</strong> ; formats jusqu’à <strong>400 000 FCFA</strong> (série).
        Promotion artiste : <strong>100 000 à 480 000+ FCFA</strong>. Brand deal mensuel :{' '}
        <strong>300 000 à 1 200 000 FCFA / mois</strong> selon palier. Détail : page{' '}
        <Link href="/tarifs" className="text-primary underline-offset-4 hover:underline">
          Tarifs
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Quelle est votre audience ?',
    a: (
      <>
        En mars 2026, nous comptons <strong>+1,4 M d’abonnés cumulés</strong> sur nos comptes, dont environ{' '}
        <strong>910 K sur TikTok</strong> et <strong>410 K sur Facebook</strong> (compte monétisé). Chiffres issus de nos
        analytics internes — les mêmes que dans notre media kit. Pour le détail des formats éditoriaux, consultez le{' '}
        <Link href={wwwPath('/')} className="text-primary underline-offset-4 hover:underline">
          site de lecture
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Comment demander un devis ?',
    a: (
      <>
        Formulaire{' '}
        <Link href="/demander-devis" className="text-primary underline-offset-4 hover:underline">
          Demander un devis
        </Link>{' '}
        ou email <strong>contact@scoop-afrique.com</strong> avec objectif, dates et budget indicatif. Réponse sous{' '}
        <strong>24–48 h</strong> ouvrées. Acompte <strong>50 % à la signature</strong> sur la plupart des prestations.
      </>
    ),
  },
  {
    q: 'Quelle est la différence entre les formules de couverture ?',
    a: (
      <>
        <strong>Classique</strong> : demi-journée ≤4 h, 2 posts + 3 stories + photos HD (175 000 FCFA plein tarif).{' '}
        <strong>Premium</strong> : journée ≤8 h, 3 posts + 5 stories + reel30 s (280 000). <strong>Gold</strong> : journée
        complète, vidéo récap 2–3 min (400 000). <strong>Gold étendu</strong> : + article + interview montée (550 000).
        Multi-jours / festival : à partir de 600 000. Voir la{' '}
        <Link href="/services/couverture-mediatique" className="text-primary underline-offset-4 hover:underline">
          fiche couverture
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Proposez-vous des partenariats long terme ou des programmes à sponsoriser ?',
    a: (
      <>
        Oui : <strong>partenariats mensuels</strong> (volume de posts/stories + reporting) et{' '}
        <strong>programmes récurrents</strong> (Scoop Game, Canapé sans filtre, micro-trottoirs, etc.). Présentation
        sponsor : page{' '}
        <Link href="/programmes" className="text-primary underline-offset-4 hover:underline">
          Programmes
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Où êtes-vous basés ?',
    a: 'Siège à Abidjan (Cocody Riviera Faya), Côte d’Ivoire. Audience présente dans plus de 12 pays, avec une forte part en Côte d’Ivoire et en diaspora.',
  },
  {
    q: 'Comment fonctionne la publication sponsorisée ?',
    a: (
      <>
        Nous adaptons votre message à nos codes ; mention claire lorsque le contenu est commercial. Formules{' '}
        <strong>Classique</strong> (post HD + stories) ou <strong>Premium</strong> (avec article et option boost). Délai
        type <strong>48 h</strong> après validation.
      </>
    ),
  },
  {
    q: 'Où sont vos mentions légales et votre politique de confidentialité ?',
    a: (
      <>
        Les textes juridiques à jour pour les utilisateurs du média sont sur le site de lecture :{' '}
        <a href={wwwPath('/mentions-legales')} className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
          Mentions légales
        </a>
        ,{' '}
        <a
          href={wwwPath('/politique-de-confidentialite')}
          className="text-primary underline-offset-4 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Politique de confidentialité
        </a>
        .
      </>
    ),
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
        <p className="mb-16 text-lg text-muted-foreground">
          Réponses alignées sur notre <strong className="font-medium text-foreground">grille V2 — mars 2026</strong> et nos chiffres
          audience publics — pour décider vite, sans aller-retour inutile.
        </p>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <Card key={i} className="border-border p-6">
              <h2 className="mb-3 font-sans text-lg font-bold uppercase tracking-wider text-foreground">{faq.q}</h2>
              <div className="text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">{faq.a}</div>
            </Card>
          ))}
        </div>

        <Card className="mt-16 border-primary/20 bg-primary/5 p-8 text-center">
          <Heading as="h2" level="h2" className="mb-4">
            Une autre question ?
          </Heading>
          <p className="mb-6 text-muted-foreground">Écrivez-nous ou passez par le formulaire : nous détaillons le périmètre et les livrables.</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaButton href="/demander-devis" variant="fillHover">
              Demander un devis
            </CtaButton>
            <CtaButton href="/contact" variant="outline">
              Contact
            </CtaButton>
          </div>
        </Card>
      </article>

      <Footer />
    </main>
  )
}
