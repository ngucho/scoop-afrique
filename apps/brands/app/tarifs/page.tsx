import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/footer'
import { Heading, Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Tarifs — grille V2 (mars 2026)',
  description:
    'Grille tarifaire V2 Scoop Afrique (FCFA TTC) : publications dès 50 000 FCFA, couvertures 175k–550k, promos, interviews, artistes, brand deals. Acompte 50 % à la signature.',
  alternates: { canonical: `${BASE_URL}/tarifs` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/tarifs`,
    title: 'Tarifs — grille V2 | Scoop Afrique',
    description: 'Prix publics cohérents charge de travail — mars 2026.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/images/hero-brands.png`, width: 1200, height: 630, alt: 'Scoop Afrique Tarifs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs | Scoop Afrique',
    description: 'Grille V2 — publications minimum 50 000 FCFA.',
    images: ['/images/hero-brands.png'],
  },
}

const publicationRows = [
  {
    formule: 'Post classique',
    inclus: '1 post (visuel client) — TikTok, Facebook, Instagram, Threads',
    tarif: '50 000',
    delai: '48–72 h',
  },
  {
    formule: 'Post + design Scoop',
    inclus: '1 post avec création graphique — toutes plateformes',
    tarif: '65 000',
    delai: '48–72 h',
  },
  {
    formule: 'Premium',
    inclus: '1 post + 1 story IG/FB + 1 article web (visuel client)',
    tarif: '75 000',
    delai: 'Selon brief',
  },
  {
    formule: 'Premium + design',
    inclus: 'Premium + création graphique Scoop',
    tarif: '90 000',
    delai: 'Selon brief',
  },
]

const publicationPackRows = [
  { formule: '3 posts classique', inclus: '3× post toutes plateformes (visuels client)', tarif: '140 000', delai: 'Pack' },
  { formule: '3 posts + design', inclus: '3× post avec design Scoop', tarif: '180 000', delai: 'Pack' },
  { formule: '3 posts premium', inclus: '3× (post + story + article web)', tarif: '210 000', delai: 'Pack' },
  { formule: 'Pack mensuel classique', inclus: '8 posts / mois', tarif: '360 000', delai: 'Mensuel' },
  { formule: 'Pack mensuel premium', inclus: '4 posts + 4 stories + 4 articles / mois', tarif: '270 000', delai: 'Mensuel' },
]

const couvertureRows = [
  {
    formule: 'Classique',
    inclus: 'Demi-journée ≤4 h — 2 posts + 3 stories + photos HD',
    tarif: '175 000',
    delai: 'Selon événement',
  },
  {
    formule: 'Premium',
    inclus: 'Journée ≤8 h — 3 posts + 5 stories + photos + 1 reel 30 s',
    tarif: '280 000',
    delai: 'Selon événement',
  },
  {
    formule: 'Gold',
    inclus: 'Journée complète — 5 posts + stories illimitées + photos + vidéo récap 2–3 min',
    tarif: '400 000',
    delai: 'Selon événement',
  },
  {
    formule: 'Gold étendu',
    inclus: 'Gold + article site + interview vidéo montée (5–7 min)',
    tarif: '550 000',
    delai: 'Selon événement',
  },
  {
    formule: 'Sur devis',
    inclus: 'Multi-jours, festival, gala — package sur mesure',
    tarif: 'À partir de 600 000',
    delai: 'Devis',
  },
]

const promoConcertRows = [
  { formule: 'Starter', inclus: '2 posts annonce + 1 story — ~1 semaine avant', tarif: '100 000', delai: '1 sem.' },
  { formule: 'Classique', inclus: '4 posts + 3 stories + 1 reel teaser — ~2 sem.', tarif: '175 000', delai: '2 sem.' },
  { formule: 'Premium', inclus: '6 posts + stories quotidiennes + 1 reel + article — 2–3 sem.', tarif: '260 000', delai: '2–3 sem.' },
  { formule: 'Gold', inclus: '8 posts + stories illimitées + 2 reels + jeu concours + article', tarif: '380 000', delai: '3 sem.' },
  {
    formule: 'Gold+',
    inclus: 'Gold + présence physique Gold le jour J',
    tarif: '700 000',
    delai: 'Campagne + J J',
  },
]

const interviewRows = [
  { formule: 'Standard', inclus: '5–10 min, 1 interviewé, Abidjan — vidéo + 1 post + 1 story', tarif: '150 000', delai: '5–8 j' },
  { formule: 'Sponsorisée', inclus: 'Format branded — vidéo + article + 2 posts', tarif: '200 000', delai: 'Selon brief' },
  { formule: 'Mini-reportage', inclus: '3–5 min, équipe 2 pers. — vidéo + photos + article', tarif: '300 000', delai: 'Selon brief' },
  { formule: 'Série 3 épisodes', inclus: '3× standard sur 3 semaines', tarif: '400 000', delai: '3 sem.' },
]

const promoArtisteRows = [
  { formule: 'Découverte', inclus: '2 posts + 1 story + 1 article biographie', tarif: '100 000', delai: '1 sem.' },
  { formule: 'Lancement single', inclus: '4 posts + 3 stories + 1 interview montée + article', tarif: '250 000', delai: '2 sem.' },
  { formule: 'Lancement album', inclus: '8 posts + stories hebdo 1 mois + interview + article', tarif: '480 000', delai: '1 mois' },
  { formule: 'Longue durée', inclus: 'Multi-semaines, tournée, clip — sur mesure', tarif: 'À partir de 600 000', delai: 'Devis' },
]

const brandDealRows = [
  { formule: 'Essentiel', inclus: '4 posts + 4 stories / mois — engagement 3 mois min.', tarif: '300 000', delai: '/ mois' },
  { formule: 'Premium', inclus: '8 posts + 8 stories + 2 articles / mois', tarif: '500 000', delai: '/ mois' },
  { formule: 'Gold', inclus: '12 posts + stories illimitées + 4 articles + 1 interview / mois', tarif: '800 000', delai: '/ mois' },
  {
    formule: 'Gold exclusif',
    inclus: 'Gold + exclusivité catégorielle + rapport analytics — engagement 6 mois min.',
    tarif: '1 200 000',
    delai: '/ mois',
  },
]

function PriceTable({
  title,
  rows,
}: {
  title: string
  rows: { formule: string; inclus: string; tarif: string; delai: string }[]
}) {
  return (
    <div className="mb-12">
      <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">{title}</h2>
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.formule} className="border-border p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="font-sans text-sm font-bold text-primary">{row.formule}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{row.inclus}</p>
              </div>
              <div className="shrink-0 text-left md:text-right">
                <p className="font-sans text-lg font-black text-foreground">{row.tarif} FCFA</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{row.delai}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function TarifsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-4xl px-6 py-16 md:px-12 md:py-20">
        <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Dot size="sm" className="text-primary" />
          Grille V2 · mars 2026 · FCFA TTC
        </div>
        <Heading as="h1" level="h1" className="mb-4">
          Tarifs <span className="text-primary">publics</span>
        </Heading>
        <p className="mb-4 text-base text-muted-foreground">
          Tarification alignée sur la <strong className="font-medium text-foreground">charge de travail réelle</strong>.{' '}
          <strong className="font-medium text-foreground">Aucune offre catalogue en dessous de 50 000 FCFA</strong> : le post
          simple multi-plateformes est notre entrée de gamme. Les montants ci-dessous sont les{' '}
          <strong className="font-medium text-foreground">pleins tarifs</strong> ; des planchers de négociation et packs
          (économies à l’unité) s’appliquent selon le brief — détaillés au devis.
        </p>
        <p className="mb-12 text-sm text-muted-foreground">
          <strong className="text-foreground">Conditions de vente (résumé) :</strong> acompte 50 % TTC à la signature, solde
          50 % à la livraison validée ; annulation &lt; 48 h : 50 % dû, &lt; 24 h : 100 % ; déplacement hors Abidjan commune
          en supplément sur justificatif. Paiements : Wave, Orange Money, Djamo Pro, virement.
        </p>

        <PriceTable title="01 — Publications & posts sponsorisés" rows={publicationRows} />
        <PriceTable title="Packs multi-publications (économies à la clé)" rows={publicationPackRows} />

        <PriceTable title="02 — Couverture médiatique événementielle" rows={couvertureRows} />

        <PriceTable title="03 — Promotion concerts & événements (sans terrain)" rows={promoConcertRows} />

        <PriceTable title="04 — Interviews & reportages" rows={interviewRows} />

        <PriceTable title="05 — Promotion artistes" rows={promoArtisteRows} />

        <PriceTable title="06 — Partenariat de marque (brand deal mensuel)" rows={brandDealRows} />

        <Card className="mb-8 border-border bg-muted/20 p-6">
          <h2 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-foreground">
            Programmes récurrents & sponsoring
          </h2>
          <p className="text-sm text-muted-foreground">
            Les formats type Scoop Game, Canapé sans filtre, etc. se chiffrent au cas par cas (saison, volume, exclusivité).
            Voir{' '}
            <Link href="/programmes" className="text-primary underline-offset-4 hover:underline">
              Programmes
            </Link>{' '}
            puis un brief.
          </p>
        </Card>

        <Card className="border-primary/20 bg-primary/5 p-8 text-center">
          <Heading as="h2" level="h2" className="mb-4">
            Devis sur mesure
          </Heading>
          <p className="mb-6 text-sm text-muted-foreground">
            Vous hésitez entre deux paliers ? Envoyez date, objectif et budget : nous vous proposons le pack le plus efficace
            (souvent un pack 3 posts ou un combo promo + jour J).
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaButton href="/demander-devis" variant="fillHover">
              Demander un devis
            </CtaButton>
            <CtaButton href="/contact" variant="outline">
              Parler à l’équipe
            </CtaButton>
          </div>
        </Card>
      </article>

      <Footer />
    </main>
  )
}
