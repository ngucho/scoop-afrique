import Image from 'next/image'
import { CtaButton } from '@/components/cta-button'
import type { BrandAudienceSummary } from '@/lib/brand-audience'

const MOBILE_IMAGE = '/images/hero-brands.png'

const FLOATING_IMAGES = [
  { src: '/images/offre-campagnes.jpg', label: 'Campagne sociale', className: 'left-[4%] top-[24%] hidden w-52 rotate-[-8deg] lg:block' },
  { src: '/images/video-premium.jpg', label: 'Video premium', className: 'right-[6%] top-[22%] hidden w-56 rotate-[7deg] lg:block' },
  { src: '/images/podcast-interview.jpg', label: 'Interview', className: 'bottom-[10%] left-[12%] hidden w-44 rotate-[6deg] xl:block' },
  { src: '/images/offre-couverture.jpg', label: 'Terrain', className: 'bottom-[8%] right-[14%] hidden w-48 rotate-[-5deg] xl:block' },
]

export function HeroBrands({ audience }: { audience: BrandAudienceSummary }) {
  const heroStats = [
    audience.totalSocial,
    audience.stats.find((s) => s.key === 'tiktok')!,
    audience.stats.find((s) => s.key === 'facebook')!,
  ]

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_18%,rgba(239,35,60,0.16),transparent_32%),linear-gradient(180deg,var(--background)_0%,color-mix(in_srgb,var(--background)_86%,var(--primary))_100%)]" />
      <div className="absolute inset-x-0 top-20 mx-auto h-[360px] max-w-[86vw] rounded-full border border-primary/10 opacity-60 md:h-[560px] md:max-w-5xl" />
      <div className="absolute inset-x-6 bottom-0 h-44 rounded-t-[3rem] bg-foreground/5 blur-3xl" />

      <div className="pointer-events-none absolute inset-0 z-0">
        {FLOATING_IMAGES.map((image) => (
          <div key={image.src} className={`absolute overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-2xl ${image.className}`}>
            <div className="relative aspect-[4/5]">
              <Image src={image.src} alt="" fill className="object-cover" sizes="240px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 right-4 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                {image.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-1px)] max-w-7xl flex-col items-center justify-center px-4 pb-8 pt-24 text-center sm:px-8 sm:pt-28 md:px-12 lg:px-20">
        <div className="max-w-5xl min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
            <span className="h-[3px] w-8 rounded-full bg-primary" aria-hidden />
            <p className="max-w-full break-words font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary sm:text-[11px] sm:tracking-[0.28em]">
              Media digital panafricain - Abidjan - Afrique au centre
            </p>
          </div>

          <h1
            className="mx-auto max-w-5xl break-words text-[clamp(2.45rem,13vw,7.8rem)] font-black leading-[0.9] text-foreground sm:leading-[0.86]"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            L&apos;audience africaine que les marques veulent vraiment toucher.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Des campagnes natives, des formats sociaux et des couvertures terrain concus pour une jeunesse mobile,
            exigeante et habituee a ignorer les messages sans contexte.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
            <CtaButton href="/demander-devis" variant="fillHover" className="w-full justify-center sm:w-auto">
              Construire une campagne
            </CtaButton>
            <CtaButton href="/services" variant="outline" className="w-full justify-center sm:w-auto">
              Voir les offres
            </CtaButton>
          </div>

          <div className="mx-auto mt-8 w-full max-w-3xl rounded-[1.5rem] border border-border bg-background/90 p-3 shadow-2xl backdrop-blur sm:mt-12 sm:rounded-[2rem] sm:p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:tracking-[0.24em]">{audience.sourceLabel}</p>
              <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
                Social proof
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.key} className="min-w-0 rounded-2xl border border-border bg-card p-4 text-left">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 break-words text-2xl font-black text-primary sm:text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>
                    {stat.display}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-8 w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-2xl sm:rounded-[2.25rem] lg:hidden">
          <div className="relative aspect-[16/10]">
            <Image src={MOBILE_IMAGE} alt="" fill className="object-cover" priority sizes="92vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/72 to-transparent" />
            <p className="absolute bottom-5 left-5 right-5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-white">
              Formats marques, terrain et social video
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
