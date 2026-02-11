import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mic2, Headphones } from 'lucide-react'
import { PlaceholderImage } from '@/components/placeholder-image'
import { Footer } from '@/components/footer'
import { Heading, Card, Dot, FillHoverAnchor } from 'scoop'
import { backLinkClassName, buttonDefaultClassName } from '@/lib/landing'

const BASE_URL = 'https://www.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Podcast & Interviews',
  description:
    'Podcasts et interviews produit par Scoop Afrique. Partenariats de marque et contenus audio pour toucher une audience panafricaine.',
  alternates: { canonical: `${BASE_URL}/podcast` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/podcast`,
    title: 'Podcast & Interviews | Scoop Afrique',
    description: 'Podcasts et interviews pour annonceurs et partenaires.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique Podcast' }],
  },
  twitter: { card: 'summary_large_image', title: 'Podcast | Scoop Afrique' },
}

const formats = [
  {
    title: 'Interview exclusive',
    description: 'Format long ou court, diffusé sur nos réseaux et partenaires. Idéal pour lancement produit, personnalité ou événement.',
    image: '/placeholders/podcast-interview.jpg',
  },
  {
    title: 'Partenariat de marque',
    description: 'Intégration naturelle de votre marque dans nos contenus podcast et vidéo. Sur devis.',
    image: '/placeholders/podcast-brand.jpg',
  },
]

export default function PodcastPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" className={backLinkClassName}>
            <span aria-hidden />
            <ArrowLeft className="mr-2 inline-block h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
          <Link href="/contact" className={buttonDefaultClassName}>
            Demander un devis
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border bg-card py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Dot size="sm" className="text-primary" />
            Podcast & Audio
          </div>
          <Heading as="h1" level="h1" className="mt-4 mb-6">
            Podcast & <span className="text-primary">interviews</span>
          </Heading>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Des formats audio et vidéo pour mettre en avant votre marque ou votre invité. Interviews, débats et
            partenariats de marque sur nos plateformes et réseaux.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Mic2 className="h-10 w-10 text-primary" />
            <Headphones className="h-10 w-10 text-primary" />
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Formats</h2>
          <p className="mb-12 font-sans text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
            Ce que nous <span className="text-primary">proposons</span>
          </p>
          <div className="grid gap-10 md:grid-cols-2">
            {formats.map((format) => (
              <Card key={format.title} className="overflow-hidden border-border transition-shadow hover:shadow-lg">
                <div className="relative aspect-[16/10] w-full bg-muted">
                  <PlaceholderImage
                    src={format.image}
                    alt=""
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    fallback={<Mic2 className="h-20 w-20 text-muted-foreground/50" />}
                  />
                </div>
                <div className="p-6">
                  <h3 className="mb-3 font-sans text-xl font-bold uppercase tracking-wider text-foreground">
                    {format.title}
                  </h3>
                  <p className="text-muted-foreground">{format.description}</p>
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Tarifs et conditions sur devis. Contact :{' '}
            <a href="mailto:Contact@scoop-afrique.com?subject=Podcast%20%2F%20Interview" className="text-primary hover:underline">
              Contact@scoop-afrique.com
            </a>
          </p>
          <div className="mt-8 text-center">
            <FillHoverAnchor href="/contact?sujet=podcast" size="default">
              Demander un devis
            </FillHoverAnchor>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-16">
        <div className="mx-auto max-w-6xl px-6 text-center md:px-12">
          <p className="mb-6 text-muted-foreground">
            Promotion artiste, concert ou partenariat de marque : nous construisons ensemble le format adapté.
          </p>
          <Link href="/contact" className={buttonDefaultClassName}>
            Nous contacter
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
