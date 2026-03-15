'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { AnimatedSection } from '@/components/animated-section'
import { serviceOffers } from '@/lib/services-data'

export function OffersSection() {
  return (
    <section id="offres" className="relative overflow-hidden bg-background py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <h2 id="offres" className="mb-2 font-sans text-lg font-semibold uppercase tracking-wider text-foreground">
          Nos offres B2B
        </h2>
        <p className="mb-10 max-w-xl text-sm text-muted-foreground">
          Couverture événementielle, contenu sponsorisé, campagnes digitales, partenariats. Tarifs indicatifs ; devis sur demande.
        </p>
        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {serviceOffers.map((offer, i) => (
              <AnimatedSection key={offer.slug} animation="fade-in-up" delay={i * 0.05}>
                <Link href={`/services/${offer.slug}`} className="group block">
                  <Card className="h-full overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[var(--shadow-lg)]">
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
                    <div className="p-5">
                      <h3 className="mb-1.5 font-sans text-base font-bold uppercase tracking-wider text-foreground">
                        {offer.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{offer.summary}</p>
                      <span className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-primary group-hover:underline">
                        Découvrir le service →
                      </span>
                    </div>
                  </Card>
                </Link>
              </AnimatedSection>
          ))}
        </div>
        <div className="mt-12 text-center">
          <CtaButton href="/contact" variant="fillHover">
            Demander un devis personnalisé
          </CtaButton>
        </div>
      </div>
    </section>
  )
}
