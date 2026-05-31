'use client'

import Image from 'next/image'
import { CtaButton } from '@/components/cta-button'

const HERO_IMAGE = '/images/hero-brands.png'

export function HeroBrands() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Image de fond */}
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          className="object-cover object-center opacity-30 dark:opacity-20"
          priority
          sizes="100vw"
          onError={(e) => {
            const t = e.target as HTMLImageElement
            t.style.display = 'none'
          }}
        />
        {/* Gradient éditorial : bg clair en bas pour lisibilité */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60"
          aria-hidden
        />
      </div>

      {/* Pattern africain décoratif */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--primary) 0, var(--primary) 1px, transparent 0, transparent 50%), repeating-linear-gradient(-45deg, var(--primary) 0, var(--primary) 1px, transparent 0, transparent 50%)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />

      {/* Contenu */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-20 sm:px-8 md:px-12 md:py-24 lg:px-20">
        <div className="max-w-3xl">
          {/* Overline */}
          <div className="mb-5 flex items-center gap-3">
            <span className="h-[3px] w-8 rounded-full bg-primary" aria-hidden />
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
              Média panafricain · Abidjan · fondé en 2025
            </p>
          </div>

          {/* Headline principale — oversized Newsreader */}
          <h1
            className="mb-6 text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            La voix de la{' '}
            <span
              className="relative inline-block"
              style={{
                backgroundImage: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              jeunesse africaine
            </span>
            {' '}— votre partenaire contenu
          </h1>

          {/* Description */}
          <p className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
            Plus de{' '}
            <strong className="font-semibold text-foreground">1,4 million d&apos;abonnés cumulés</strong>{' '}
            (mars 2026) sur TikTok, Facebook, Instagram, YouTube et Threads. Formats mobiles,
            réponse sous 48 h, tarifs publiés.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <CtaButton href="/demander-devis" variant="fillHover">
              Demander un devis
            </CtaButton>
            <CtaButton href="#offres" variant="outline">
              Voir les offres
            </CtaButton>
          </div>

          {/* Lien programmes */}
          <p className="mt-7 font-sans text-xs text-muted-foreground">
            <a
              href="/programmes"
              className="inline-flex items-center gap-1 text-primary underline-offset-4 transition-opacity hover:underline hover:opacity-80"
            >
              Programmes éditoriaux &amp; sponsoring
              <span aria-hidden>→</span>
            </a>
            {' '}— Scoop Game, Canapé sans filtre, micro-trottoirs…
          </p>
        </div>

        {/* Stats inline sous le titre */}
        <div className="mt-16 flex flex-wrap gap-8 border-t border-border pt-10 sm:gap-12">
          {[
            { value: '+1,4 M', label: 'Abonnés cumulés' },
            { value: '910 K', label: 'TikTok' },
            { value: '12+', label: 'Pays touchés' },
          ].map((s) => (
            <div key={s.label} className="min-w-[80px]">
              <p
                className="font-sans text-2xl font-black text-primary sm:text-3xl"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {s.value}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
