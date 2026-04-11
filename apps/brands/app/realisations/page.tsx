import type { Metadata } from 'next'
import Image from 'next/image'
import { Footer } from '@/components/footer'
import { Heading, Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { wwwPath } from '@/lib/site-urls'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Réalisations & preuves',
  description:
    'Réalisations Scoop Afrique : études de cas (NCI, Grand Bassam, FIMO 228…), chiffres audience 2026, types de productions.',
  alternates: { canonical: `${BASE_URL}/realisations` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/realisations`,
    title: 'Réalisations | Scoop Afrique',
    description: 'Portfolio & retours clients — grille 2026.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/images/hero-brands.png`, width: 1200, height: 630, alt: 'Scoop Afrique Réalisations' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Réalisations | Scoop Afrique',
    description: 'Preuves & formats produits.',
    images: ['/images/hero-brands.png'],
  },
}

/** Retours courts issus du media kit 2026. */
const proofs = [
  {
    client: 'NCI — Séries CASTÉ',
    type: 'Brand content · TV / streaming',
    amount: '150 000 FCFA',
    quote:
      'Couverture et production de contenus vidéo pour les séries NCI — livraison saluée par le client pour la qualité et le respect des délais.',
    initials: 'NCI',
  },
  {
    client: 'Grand Bassam',
    type: 'Couverture événement',
    amount: '180 000 FCFA',
    quote: 'Terrain et multi-formats : visibilité locale forte et relais digital cohérent avec l’ampleur de l’événement.',
    initials: 'GB',
  },
  {
    client: 'FIMO 228',
    type: 'Partenariat',
    amount: '85 000 FCFA',
    quote: 'Trois publications sponsorisées dans le cadre d’un accord — reach notable et adéquation avec la ligne musique / culture.',
    initials: 'FIMO',
  },
]

const realisations = [
  {
    title: 'Couverture événementielle',
    description: 'Concert, festival, lancement. Formules Classique à Étendu — posts, stories, récap vidéo, micro-trottoir.',
    image: '/images/offre-couverture.jpg',
    platforms: ['TikTok', 'Instagram', 'Facebook', 'YouTube'],
  },
  {
    title: 'Campagnes digitales',
    description: 'Teasing, rappels, contenu jour J — pensé pour la billetterie et les lancements.',
    image: '/images/offre-campagnes.jpg',
    platforms: ['TikTok', 'Instagram', 'Facebook'],
  },
  {
    title: 'Publication sponsorisée',
    description: 'Message clair, créa adaptée, métriques J+7 sur demande.',
    image: '/images/offre-publication.jpg',
    platforms: ['TikTok', 'Instagram', 'Facebook'],
  },
  {
    title: 'Interview & reportage',
    description: 'Standard 150 000 FCFA plein tarif — formats jusqu’à mini-reportage ou série (grille V2).',
    image: '/images/offre-sponsorise.jpg',
    platforms: ['TikTok', 'Instagram', 'Facebook', 'YouTube'],
  },
  {
    title: 'Partenariat de marque',
    description: 'Rythme mensuel, reporting, palettes Essentiel à Gold (min. 500 K à 2 M).',
    image: '/images/offre-partenariat.jpg',
    platforms: ['TikTok', 'Instagram', 'Facebook', 'YouTube', 'Threads'],
  },
]

const stats = [
  { value: '+1,4 M', label: 'Abonnés cumulés' },
  { value: '910 K', label: 'TikTok' },
  { value: '12+', label: 'Pays' },
  { value: '5+', label: 'Réseaux actifs' },
]

export default function RealisationsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-card py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Dot size="sm" className="text-primary" />
            Portfolio
          </div>
          <Heading as="h1" level="h1" className="mt-4 mb-6">
            Nos <span className="text-primary">réalisations</span>
          </Heading>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Quelques preuves issues de notre media kit 2026, les mêmes chiffres audience que sur l’accueil partenaires, et la
            diversité des formats que nous produisons au quotidien — visibles sur{' '}
            <a href={wwwPath('/')} className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
              scoop-afrique.com
            </a>
            .
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Audience · mars 2026 · analytics internes plateformes.</p>
          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-sans text-2xl font-black text-primary md:text-3xl">{stat.value}</div>
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/20 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Ils nous ont fait confiance</h2>
          <p className="mb-10 font-sans text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
            Preuves & <span className="text-primary">retours</span>
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {proofs.map((p) => (
              <Card key={p.client} className="flex flex-col border-border p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background font-brasika text-lg font-black text-primary">
                  {p.initials}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{p.type}</p>
                <h3 className="mt-1 font-sans text-base font-bold text-foreground">{p.client}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">&ldquo;{p.quote}&rdquo;</p>
                <p className="mt-4 font-sans text-sm font-bold text-primary">Budget indicatif : {p.amount}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Types de projets</h2>
          <p className="mb-12 font-sans text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
            Ce que nous <span className="text-primary">produisons</span>
          </p>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {realisations.map((r) => (
              <Card key={r.title} className="overflow-hidden border-border transition-shadow hover:shadow-lg">
                <div className="relative aspect-[16/10] w-full bg-muted">
                  <Image
                    src={r.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 font-sans text-xl font-bold uppercase tracking-wider text-foreground">{r.title}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{r.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {r.platforms.map((p) => (
                      <span
                        key={p}
                        className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-16">
        <div className="mx-auto max-w-6xl px-6 text-center md:px-12">
          <p className="mb-6 text-muted-foreground">
            Suivez le fil éditorial en direct ou lancez un brief : même équipe, deux entrées selon votre besoin.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <CtaButton href={wwwPath('/')} variant="outline" external>
              Lire scoop-afrique.com
            </CtaButton>
            <CtaButton href="/demander-devis" variant="fillHover">
              Demander un devis
            </CtaButton>
            <CtaButton href="https://www.tiktok.com/@Scoop.Afrique" variant="outline" external>
              TikTok
            </CtaButton>
            <CtaButton href="https://www.instagram.com/Scoop.Afrique" variant="outline" external>
              Instagram
            </CtaButton>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
