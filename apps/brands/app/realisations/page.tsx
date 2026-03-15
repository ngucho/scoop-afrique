import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Heading, Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Réalisations & Portfolio',
  description:
    'Découvrez les réalisations Scoop Afrique : couvertures événementielles, campagnes digitales, partenariats de marque. Notre portfolio panafricain.',
  alternates: { canonical: `${BASE_URL}/realisations` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/realisations`,
    title: 'Réalisations & Portfolio | Scoop Afrique',
    description: 'Nos réalisations : couvertures, campagnes, partenariats.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique Réalisations' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Réalisations | Scoop Afrique',
    description: 'Nos réalisations : couvertures, campagnes, partenariats.',
    images: ['/og-image.png'],
  },
}

const realisations = [
  {
    title: 'Couverture événementielle',
    description: 'Concert, festival, lancement produit. Présence sur place, captage ambiance, recap multi-plateformes.',
    image: '/images/offre-couverture.jpg',
    platforms: ['TikTok', 'Instagram', 'Facebook', 'YouTube'],
  },
  {
    title: 'Campagnes digitales',
    description: 'Promotion concert, annonce événement, micro trottoir. Formats adaptés à chaque objectif.',
    image: '/images/offre-campagnes.jpg',
    platforms: ['TikTok', 'Instagram', 'Facebook'],
  },
  {
    title: 'Publication sponsorisée',
    description: 'Posts, stories, articles. Visibilité ciblée sur notre audience panafricaine.',
    image: '/images/offre-publication.jpg',
    platforms: ['TikTok', 'Instagram', 'Facebook'],
  },
  {
    title: 'Interview & Reportage',
    description: 'Format standard diffusé sur nos réseaux. Idéal pour lancement, personnalité, événement.',
    image: '/images/offre-sponsorise.jpg',
    platforms: ['TikTok', 'Instagram', 'Facebook', 'YouTube'],
  },
  {
    title: 'Partenariat de marque',
    description: 'Contenu permanent, liens officiels. 2 posts + 2 stories/semaine sur tous nos réseaux.',
    image: '/images/offre-partenariat.jpg',
    platforms: ['TikTok', 'Instagram', 'Facebook', 'YouTube', 'Threads'],
  },
]

const stats = [
  { value: '300M+', label: 'Vues cumulées' },
  { value: '1,25M+', label: 'Abonnés' },
  { value: '12+', label: 'Pays couverts' },
  { value: '5', label: 'Plateformes' },
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
            Couverture événementielle, campagnes digitales, partenariats de marque. Découvrez notre portfolio et l&apos;impact de notre audience panafricaine.
          </p>
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
                  <h3 className="mb-2 font-sans text-xl font-bold uppercase tracking-wider text-foreground">
                    {r.title}
                  </h3>
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
            Suivez-nous sur nos réseaux pour découvrir nos contenus en direct.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <CtaButton href="https://www.tiktok.com/@Scoop.Afrique" variant="outline" external>TikTok</CtaButton>
            <CtaButton href="https://www.instagram.com/Scoop.Afrique" variant="outline" external>Instagram</CtaButton>
            <CtaButton href="https://www.facebook.com/profile.php?id=61568464568442" variant="outline" external>Facebook</CtaButton>
            <CtaButton href="https://www.youtube.com/@Scoop.Afrique" variant="outline" external>YouTube</CtaButton>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
