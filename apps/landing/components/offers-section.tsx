'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, Dot, FillHoverAnchor } from 'scoop'
import { Video, Megaphone, BarChart3, Handshake, GraduationCap } from 'lucide-react'

const offers = [
  {
    title: 'Couverture d’événements',
    description: 'Tournage, montage et diffusion sur nos réseaux. Idéal pour lancements, salons, concerts.',
    price: '1 000 € – 3 000 €',
    icon: Video,
    image: '/placeholders/offre-couverture.jpg',
    href: '/video',
  },
  {
    title: 'Contenu sponsorisé',
    description: 'Reportages, interviews, documentaires sur mesure. Visibilité et crédibilité.',
    price: '3 000 € – 15 000 €',
    icon: Megaphone,
    image: '/placeholders/offre-sponsorise.jpg',
    href: '/contact?sujet=contenu-sponsorise',
  },
  {
    title: 'Campagnes digitales',
    description: 'Stratégie, production et diffusion. Objectif : portée et conversions.',
    price: '10 000 € – 50 000 €',
    icon: BarChart3,
    image: '/placeholders/offre-campagnes.jpg',
    href: '/contact?sujet=campagne',
  },
  {
    title: 'Partenariats médiatiques',
    description: 'Séries, co-branding, événements. Relation durable avec votre marque.',
    price: 'Sur devis (à partir de 30 000 €/an)',
    icon: Handshake,
    image: '/placeholders/offre-partenariat.jpg',
    href: '/contact?sujet=partenariat',
  },
  {
    title: 'Formation & conseil',
    description: 'Réseaux sociaux, production vidéo, stratégie digitale. Sur mesure.',
    price: '500 € – 2 000 €/jour',
    icon: GraduationCap,
    image: '/placeholders/offre-formation.jpg',
    href: '/contact?sujet=formation',
  },
]

export function OffersSection() {
  return (
    <section id="offres" className="relative overflow-hidden bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Dot size="sm" className="text-primary" />
          Nos offres B2B
        </div>
        <h2 className="mb-4 font-sans text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
          Des solutions pour chaque <span className="text-primary">objectif</span>
        </h2>
        <p className="mb-16 max-w-2xl text-muted-foreground">
          Couverture événementielle, contenu sponsorisé, campagnes digitales, partenariats et formation. Tarifs indicatifs ; devis personnalisé sur demande.
        </p>
        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <Link key={offer.title} href={offer.href} className="group block">
              <Card className="h-full overflow-hidden border-border transition-all duration-300 hover:border-primary hover:shadow-lg">
                <div className="relative aspect-[16/10] w-full bg-muted">
                  <Image
                    src={offer.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.style.display = 'none'
                      t.parentElement?.classList.add('js-fallback-visible')
                    }}
                  />
                  <div className="absolute inset-0 hidden items-center justify-center bg-muted [.js-fallback-visible_&]:flex">
                    <offer.icon className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                  <div className="absolute bottom-3 left-3 rounded border border-border bg-background/90 px-3 py-1 font-mono text-xs font-bold text-foreground backdrop-blur">
                    {offer.price}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="mb-2 font-sans text-xl font-bold uppercase tracking-wider text-foreground">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{offer.description}</p>
                  <span className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-primary group-hover:underline">
                    En savoir plus →
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-12 text-center">
          <FillHoverAnchor href="/contact" size="default">
            Demander un devis personnalisé
          </FillHoverAnchor>
        </div>
      </div>
    </section>
  )
}
