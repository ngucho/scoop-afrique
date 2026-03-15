'use client'

import Image from 'next/image'
import { CtaButton } from '@/components/cta-button'

const HERO_IMAGE = '/images/hero-brands.jpg'

export function HeroBrands() {
  return (
    <section className="relative min-h-screen overflow-hidden border-b border-[var(--surface-border)] bg-card">
      <div className="absolute inset-0 z-0 w-full">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          className="object-cover object-right opacity-80"
          priority
          sizes="100vw"
          onError={(e) => {
            const t = e.target as HTMLImageElement
            t.style.display = 'none'
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'var(--gradient-hero-overlay)' }}
          aria-hidden
        />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16 sm:px-8 md:px-12 md:py-20 lg:px-20">
        <div className="max-w-2xl">
          <h1 className="mb-4 font-sans text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Le média de référence de la <span className="text-primary">jeunesse africaine</span> francophone
          </h1>
          <p className="mb-8 max-w-lg text-sm text-muted-foreground sm:text-base">
            Donner une voix et une vitrine à l&apos;Afrique en produisant des contenus audiovisuels impactants.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <CtaButton href="/demander-devis" variant="fillHover">
              Demander un devis
            </CtaButton>
            <CtaButton href="#offres" variant="outline">
              Nos offres
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  )
}
