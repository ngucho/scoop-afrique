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
    <section className="relative min-h-[96vh] overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_18%,rgba(239,35,60,0.16),transparent_32%),linear-gradient(180deg,var(--background)_0%,color-mix(in_srgb,var(--background)_86%,var(--primary))_100%)]" />
      <div className="absolute inset-x-0 top-20 mx-auto h-[560px] max-w-5xl rounded-full border border-primary/10 opacity-60" />
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

      <div className="relative z-10 mx-auto flex min-h-[96vh] max-w-7xl flex-col items-center justify-center px-5 pb-10 pt-28 text-center sm:px-8 md:px-12 lg:px-20">
        <div className="max-w-5xl">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
            <span className="h-[3px] w-8 rounded-full bg-primary" aria-hidden />
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
              Media digital panafricain - Abidjan - Afrique au centre
            </p>
          </div>

          <h1
            className="mx-auto max-w-5xl text-[clamp(3.4rem,8vw,7.8rem)] font-black leading-[0.86] text-foreground"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            L&apos;audience africaine que les marques veulent vraiment toucher.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Des campagnes natives, des formats sociaux et des couvertures terrain concus pour une jeunesse mobile,
            exigeante et habituee a ignorer les messages sans contexte.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <CtaButton href="/demander-devis" variant="fillHover">
              Construire une campagne
            </CtaButton>
            <CtaButton href="/services" variant="outline">
              Voir les offres
            </CtaButton>
          </div>

          <div className="mx-auto mt-12 w-full max-w-3xl rounded-[2rem] border border-border bg-background/86 p-4 shadow-2xl backdrop-blur md:p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{audience.sourceLabel}</p>
              <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
                Social proof
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.key} className="rounded-2xl border border-border bg-card p-4 text-left">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-black text-primary" style={{ fontFamily: 'var(--font-headline)' }}>
                    {stat.display}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-10 w-full max-w-xl overflow-hidden rounded-[2.25rem] border border-border bg-card shadow-2xl lg:hidden">
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
