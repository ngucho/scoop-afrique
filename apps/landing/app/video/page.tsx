import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Play, BarChart3, Users } from 'lucide-react'
import { PlaceholderImage } from '@/components/placeholder-image'
import { Footer } from '@/components/footer'
import { Heading, Card, Dot, GlitchText, FillHoverAnchor } from 'scoop'
import { backLinkClassName, buttonDefaultClassName } from '@/lib/landing'

const BASE_URL = 'https://www.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Vidéo & Couverture médiatique',
  description:
    'Couverture événementielle, reportages vidéo et contenus sponsorisés. Scoop Afrique accompagne marques et organisateurs avec une audience panafricaine.',
  alternates: { canonical: `${BASE_URL}/video` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/video`,
    title: 'Vidéo & Couverture médiatique | Scoop Afrique',
    description: 'Couverture événementielle, reportages et contenus vidéo pour les annonceurs et partenaires.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique Vidéo' }],
  },
  twitter: { card: 'summary_large_image', title: 'Vidéo | Scoop Afrique' },
}

const offers = [
  {
    title: 'Couverture classique',
    price: '100 000 FCFA',
    items: ['Présence sur place', 'Captage ambiance & stories', 'Une publication recap sur tous nos réseaux avec mention'],
    image: '/placeholders/video-classique.jpg',
  },
  {
    title: 'Couverture premium',
    price: '200 000 FCFA',
    items: ['Présence sur place', 'Captage ambiance & stories', 'Moments forts en post TikTok + Instagram + Facebook', 'Publication recap avec mention'],
    image: '/placeholders/video-premium.jpg',
  },
  {
    title: 'Couverture gold',
    price: '400 000 FCFA',
    items: ['Équipe complète Scoop sur place', 'Tapis rouge : styles + interviews personnalités', 'Publication sur tous nos réseaux', 'Vidéo recap de l’événement'],
    image: '/placeholders/video-gold.jpg',
  },
]

const stats = [
  { icon: BarChart3, value: '300M+', label: 'Vues sur nos réseaux' },
  { icon: Users, value: '1,25M+', label: 'Abonnés' },
]

export default function VideoPage() {
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
            Vidéo & Événementiel
          </div>
          <Heading as="h1" level="h1" className="mt-4 mb-6">
            Couverture <span className="text-primary">médiatique</span> et contenus vidéo
          </Heading>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Tournage, montage et diffusion sur TikTok, Instagram, Facebook, YouTube. Nous accompagnons marques, artistes et
            organisateurs avec une audience panafricaine engagée.
          </p>
          <div className="mt-10 flex flex-wrap gap-6">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <s.icon className="h-8 w-8 text-primary" />
                <div>
                  <span className="block font-sans text-2xl font-black text-primary">{s.value}</span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Nos offres</h2>
          <p className="mb-12 font-sans text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
            Couverture <span className="text-primary">événementielle</span>
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {offers.map((offer) => (
              <Card key={offer.title} className="overflow-hidden border-border transition-shadow hover:shadow-lg">
                <div className="relative aspect-video w-full bg-muted">
                  <PlaceholderImage
                    src={offer.image}
                    alt=""
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    fallback={<Play className="h-16 w-16 text-muted-foreground/50" />}
                  />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 font-sans text-xl font-bold uppercase tracking-wider text-foreground">
                    {offer.title}
                  </h3>
                  <p className="mb-4 font-sans text-2xl font-black text-primary">{offer.price}</p>
                  <ul className="list-none space-y-2 text-sm text-muted-foreground">
                    {offer.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <FillHoverAnchor href="/contact?sujet=couverture-video" size="default">
              Demander un devis personnalisé
            </FillHoverAnchor>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-16">
        <div className="mx-auto max-w-6xl px-6 text-center md:px-12">
          <p className="mb-6 text-muted-foreground">
            Contenu sponsorisé, reportages, documentaires : tarifs sur devis à partir de 3 000 €.
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
