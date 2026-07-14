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
    'FAQ Scoop Afrique - partenariats, offres 2026, couverture, publications, programmes sponsoring et media kit.',
  alternates: { canonical: `${BASE_URL}/faq` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/faq`,
    title: 'FAQ | Scoop Afrique',
    description: 'Questions frequentes - offres B2B, services et sponsoring.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/images/hero-brands.png`, width: 1200, height: 630, alt: 'Scoop Afrique FAQ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | Scoop Afrique',
    description: 'Questions frequentes sur nos services B2B.',
    images: ['/images/hero-brands.png'],
  },
}

const faqs = [
  {
    q: 'Ou voir les offres et les prix ?',
    a: (
      <>
        Les prix sont desormais directement rattaches aux offres pour eviter une double lecture. Retrouvez les formats,
        livrables, niveaux de production et budgets indicatifs sur la page{' '}
        <Link href="/services" className="text-primary underline-offset-4 hover:underline">
          Offres & services
        </Link>
        . Pour un programme sur mesure, nous confirmons le perimetre dans le devis.
      </>
    ),
  },
  {
    q: 'Quelle est votre audience ?',
    a: (
      <>
        Nos chiffres visibles viennent de la meme source que le tableau de bord audience : TikTok, Facebook, Instagram,
        Threads et newsletter. Le compteur site web n&apos;est plus affiche ici, car il correspondait a un indicateur
        newsletter et creait une confusion. Pour le rendu editorial, consultez le{' '}
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
        Passez par le formulaire{' '}
        <Link href="/demander-devis" className="text-primary underline-offset-4 hover:underline">
          Demander un devis
        </Link>{' '}
        ou envoyez un email a <strong>contact@scoop-afrique.com</strong> avec votre objectif, vos dates, vos plateformes
        prioritaires et un budget indicatif. Nous repondons generalement sous <strong>24 a 48 h</strong> ouvrees.
      </>
    ),
  },
  {
    q: 'Quelle est la difference entre les formules de couverture ?',
    a: (
      <>
        La difference vient du temps terrain, du volume de contenus, du niveau de montage et de la presence ou non d&apos;un
        article editorial. La fiche{' '}
        <Link href="/services/couverture-mediatique" className="text-primary underline-offset-4 hover:underline">
          couverture mediatique
        </Link>{' '}
        detaille les options utiles pour un lancement, un concert, une conference ou un festival.
      </>
    ),
  },
  {
    q: 'Proposez-vous des partenariats long terme ou des programmes a sponsoriser ?',
    a: (
      <>
        Oui : partenariats mensuels, operations editoriales, capsules recurrentes et programmes sponsorisables. Les
        formats disponibles sont presentes dans la page{' '}
        <Link href="/programmes" className="text-primary underline-offset-4 hover:underline">
          Programmes
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Ou etes-vous bases ?',
    a: "Scoop Afrique est base a Abidjan, avec une audience forte en Cote d'Ivoire, dans la diaspora et dans plusieurs pays africains francophones.",
  },
  {
    q: 'Comment fonctionne une publication sponsorisee ?',
    a: (
      <>
        Nous adaptons votre message aux codes de Scoop Afrique, avec validation editoriale et mention claire lorsque le
        contenu est commercial. Le delai depend du format, mais les publications simples peuvent etre preparees rapidement
        apres validation des assets.
      </>
    ),
  },
  {
    q: 'Ou sont vos mentions legales et votre politique de confidentialite ?',
    a: (
      <>
        Les textes juridiques a jour pour les utilisateurs du media sont sur le site de lecture :{' '}
        <a
          href={wwwPath('/mentions-legales')}
          className="text-primary underline-offset-4 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mentions legales
        </a>
        ,{' '}
        <a
          href={wwwPath('/politique-de-confidentialite')}
          className="text-primary underline-offset-4 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Politique de confidentialite
        </a>
        .
      </>
    ),
  },
]

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-4xl px-4 py-14 sm:px-8 sm:py-16">
        <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-widest">
          <Dot size="sm" className="text-primary" />
          Questions frequentes
        </div>
        <Heading as="h1" level="h1" className="mb-4 break-words">
          <span className="text-primary">FAQ</span>
        </Heading>
        <p className="mb-16 text-lg text-muted-foreground">
          Des reponses courtes pour comprendre les offres, les formats et la maniere de travailler avec Scoop Afrique.
        </p>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <Card key={i} className="border-border p-5 sm:p-6">
              <h2 className="mb-3 break-words font-sans text-base font-bold uppercase tracking-wide text-foreground sm:text-lg sm:tracking-wider">{faq.q}</h2>
              <div className="break-words text-sm leading-7 text-muted-foreground sm:text-base [&_strong]:font-medium [&_strong]:text-foreground">{faq.a}</div>
            </Card>
          ))}
        </div>

        <Card className="mt-16 border-primary/20 bg-primary/5 p-5 text-center sm:p-8">
          <Heading as="h2" level="h2" className="mb-4 break-words">
            Une autre question ?
          </Heading>
          <p className="mb-6 text-muted-foreground">
            Ecrivez-nous ou passez par le formulaire : nous detaillons le perimetre, les livrables et le calendrier.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaButton href="/demander-devis" variant="fillHover" className="w-full justify-center sm:w-auto">
              Demander un devis
            </CtaButton>
            <CtaButton href="/contact" variant="outline" className="w-full justify-center sm:w-auto">
              Contact
            </CtaButton>
          </div>
        </Card>
      </article>

      <Footer />
    </main>
  )
}
