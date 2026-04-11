'use client'

import Image from 'next/image'
import { CtaButton } from '@/components/cta-button'

const HERO_IMAGE = '/images/hero-brands.png'

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
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-primary/90 sm:text-xs">
            Média panafricain · Abidjan · fondé en 2026
          </p>
          <h1 className="mb-4 font-sans text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
            La voix créative de la <span className="text-primary">jeunesse afro-francophone</span> — et votre partenaire
            contenu
          </h1>
          <p className="mb-8 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Plus d’1,4 million d’abonnés cumulés (mars 2026) sur TikTok, Facebook, Instagram, YouTube et Threads. Nous
            produisons des formats éditoriaux qui performent sur mobile : couvertures live, interviews, jeux avec des
            personnalités, micro-trottoirs, reportages. Tarifs publiés, process clair, réponse sous 24-48 h.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <CtaButton href="/demander-devis" variant="fillHover">
              Demander un devis
            </CtaButton>
            <CtaButton href="#offres" variant="outline">
              Voir les offres
            </CtaButton>
          </div>
          <p className="mt-6 max-w-md text-xs text-muted-foreground">
            <a href="/programmes" className="text-primary underline-offset-4 hover:underline">
              Programmes éditoriaux & sponsoring
            </a>{' '}
            — formats récurrents (Scoop Game, Canapé sans filtre, micro-trottoirs…).
          </p>
        </div>
      </div>
    </section>
  )
}
