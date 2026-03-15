import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Play, BarChart3, Users, Mic2, Headphones } from 'lucide-react'
import { PlaceholderImage } from '@/components/placeholder-image'
import { Footer } from '@/components/footer'
import { Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { serviceOffers, couvertureFormules } from '@/lib/services-data'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Services & Offres B2B',
  description:
    'Couverture événementielle, publication, interview, promo concert, partenariat de marque. Scoop Afrique accompagne marques et organisateurs avec une audience panafricaine.',
  alternates: { canonical: `${BASE_URL}/services` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/services`,
    title: 'Services & Offres B2B | Scoop Afrique',
    description: 'Couverture événementielle, contenus sponsorisés, campagnes digitales pour annonceurs et partenaires.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique Services' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Services | Scoop Afrique',
    description: 'Couverture événementielle, contenus sponsorisés, campagnes digitales pour annonceurs et partenaires.',
    images: ['/og-image.png'],
  },
}

const stats = [
  { icon: BarChart3, value: '300M+', label: 'Vues sur nos réseaux' },
  { icon: Users, value: '1,25M+', label: 'Abonnés' },
]

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-card py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Dot size="sm" className="text-primary" />
            Nos services B2B
          </div>
          <h1 className="mt-4 mb-6 font-sans text-2xl font-bold uppercase tracking-tight text-foreground md:text-3xl">
            Couverture, contenu & <span className="text-primary">partenariats</span>
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Tournage, montage et diffusion sur TikTok, Instagram, Facebook, YouTube. Nous accompagnons marques, artistes et
            organisateurs avec une audience panafricaine engagée. Nos tarifs sont accessibles : structure agile, équipe réactive,
            pas de surcoûts superflus — une approche pensée pour les PME et startups africaines.
          </p>
          <div className="mt-10 flex flex-wrap gap-6">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <s.icon className="h-8 w-8 text-primary" />
                <div>
                  <span className="block font-sans text-xl font-bold text-primary">{s.value}</span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Nos services</h2>
          <p className="mb-4 font-sans text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl">
            Cliquez sur un service pour en savoir plus
          </p>
          <p className="mb-10 max-w-2xl text-sm text-muted-foreground">
            Chaque service est détaillé : ce qu&apos;il couvre, comment nous le livrons, les livrables inclus et notre approche tarifaire.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {serviceOffers.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`} className="group block">
                <Card className="h-full overflow-hidden border-border transition-all hover:border-primary/50 hover:shadow-lg">
                  <div className="relative aspect-[16/10] w-full bg-muted">
                    <Image
                      src={service.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute bottom-3 left-3 rounded border border-border bg-background/90 px-3 py-1 font-mono text-xs font-bold text-foreground backdrop-blur">
                      {service.price}
                    </div>
                  </div>
                  <div className="p-5">
                    <service.icon className="mb-3 h-8 w-8 text-primary" />
                    <h3 className="mb-2 font-sans text-base font-bold uppercase tracking-wider text-foreground">
                      {service.title}
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground">{service.summary}</p>
                    <span className="font-mono text-xs uppercase tracking-widest text-primary group-hover:underline">
                      Découvrir le service →
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <CtaButton href="/contact" variant="fillHover">
              Demander un devis personnalisé
            </CtaButton>
          </div>
        </div>
      </section>

      <section id="formules-couverture" className="border-t border-border bg-card py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Formules couverture</h2>
          <p className="mb-10 font-sans text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl">
            Couverture <span className="text-primary">médiatique</span> — détail des formules
          </p>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {couvertureFormules.map((formule) => (
              <Card key={formule.title} className="overflow-hidden border-border transition-shadow hover:shadow-lg">
                <div className="relative aspect-video w-full bg-muted">
                  <PlaceholderImage
                    src={formule.image}
                    alt=""
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    fallback={<Play className="h-16 w-16 text-muted-foreground/50" />}
                  />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 font-sans text-base font-bold uppercase tracking-wider text-foreground">
                    {formule.title}
                  </h3>
                  <p className="mb-4 font-sans text-2xl font-black text-primary">{formule.price}</p>
                  <ul className="list-none space-y-2 text-sm text-muted-foreground">
                    {formule.items.map((item) => (
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
          <div className="mt-8 text-center">
            <CtaButton href="/services/couverture-mediatique" variant="outline">
              Voir la fiche complète
            </CtaButton>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-6xl px-6 text-center md:px-12">
          <p className="mb-6 text-muted-foreground">
            Contenu sponsorisé, reportages, documentaires : tarifs sur devis.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Mic2 className="h-8 w-8 text-primary" aria-hidden />
            <Headphones className="h-8 w-8 text-primary" aria-hidden />
          </div>
          <Link href="/contact" className="mt-6 inline-block text-primary hover:underline">
            contact@scoop-afrique.com
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
