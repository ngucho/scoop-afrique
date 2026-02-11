'use client'

import Link from 'next/link'
import Image from 'next/image'
import { GlitchText, Dot, FillHoverAnchor, AfricanPattern } from 'scoop'
import { buttonDefaultClassName } from '@/lib/landing'

const stats = [
  { value: '1,25 M+', label: 'Abonnés' },
  { value: '300 M+', label: 'Vues' },
  { value: '12+', label: 'Pays' },
]

const PLACEHOLDER_HERO = '/placeholders/hero-b2b.jpg'

export function HeroB2b() {
  return (
    <section className="relative min-h-[85vh] overflow-hidden border-b border-border bg-card">
      <div className="absolute inset-0 z-0">
        <Image
          src={PLACEHOLDER_HERO}
          alt=""
          fill
          className="object-cover opacity-30"
          priority
          sizes="100vw"
          onError={(e) => {
            const t = e.target as HTMLImageElement
            t.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] opacity-10">
          <AfricanPattern className="h-full w-full" />
        </div>
      </div>
      <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 md:min-h-[85vh] md:px-12 md:py-24 lg:px-20">
        <div className="max-w-3xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground sm:mb-4">
            Média panafricain — Annonceurs, partenaires, marques
          </p>
          <h1 className="mb-4 font-sans text-3xl font-black uppercase leading-[1.1] tracking-tight text-foreground sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
            Touchez une audience <span className="text-primary">engagée</span> en Afrique
          </h1>
          <p className="mb-8 max-w-xl text-base text-muted-foreground sm:mb-10 sm:text-lg">
            Couverture événementielle, contenus sponsorisés, campagnes digitales et partenariats médiatiques. Nous
            produisons et diffusons sur TikTok, Instagram, Facebook, YouTube.
          </p>
          <div className="mb-8 flex flex-wrap items-center gap-4 sm:mb-12 sm:gap-6">
            {stats.map((s) => (
              <div key={s.label}>
                <span className="block font-sans text-xl font-black text-primary sm:text-2xl md:text-3xl">{s.value}</span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <FillHoverAnchor href="/contact" size="lg">
              Demander un devis
            </FillHoverAnchor>
            <Link href="#offres" className={'text-primary' + buttonDefaultClassName.replace('bg-primary', 'bg-transparent') + ' border-primary hover:bg-primary hover:text-primary-foreground'}>
              Voir nos offres
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
