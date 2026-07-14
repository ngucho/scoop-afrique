import Image from 'next/image'
import { CtaButton } from '@/components/cta-button'
import type { BrandAudienceSummary } from '@/lib/brand-audience'

const HERO_IMAGE = '/images/hero-brands.png'

export function HeroBrands({ audience }: { audience: BrandAudienceSummary }) {
  const heroStats = [
    audience.totalSocial,
    audience.stats.find((s) => s.key === 'tiktok')!,
    audience.siteVisits,
  ]

  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          className="object-cover object-center opacity-40"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_srgb,var(--background)_92%,transparent)_44%,color-mix(in_srgb,var(--background)_48%,transparent)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-5 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.62fr)_minmax(320px,0.38fr)] lg:items-end">
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="h-[3px] w-8 rounded-full bg-primary" aria-hidden />
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                Media digital panafricain · Abidjan · Afrique au centre
              </p>
            </div>

            <h1
              className="max-w-4xl text-[clamp(2.8rem,7vw,6.4rem)] font-black leading-[0.9] text-foreground"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Pas seulement un media. Un mouvement pour une Afrique qui se raconte elle-meme.
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Scoop Afrique connecte les marques, institutions et projets ambitieux a une jeunesse africaine urbaine,
              mobile et exigeante. Nous produisons des campagnes natives, des couvertures terrain et des formats sociaux
              qui vivent dans la conversation, pas autour d&apos;elle.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CtaButton href="/demander-devis" variant="fillHover">
                Construire une campagne
              </CtaButton>
              <CtaButton href="/tarifs" variant="outline">
                Voir les tarifs 2026
              </CtaButton>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/86 p-4 shadow-2xl backdrop-blur md:p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{audience.sourceLabel}</p>
            <div className="mt-4 grid gap-3">
              {heroStats.map((stat) => (
                <div key={stat.key} className="flex items-end justify-between gap-4 border-t border-border pt-3 first:border-t-0 first:pt-0">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-black text-primary" style={{ fontFamily: 'var(--font-headline)' }}>
                    {stat.display}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              TikTok, Facebook, Instagram, Threads et site media: des points d&apos;entree differents, un meme recit africain.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
