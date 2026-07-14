import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, BarChart3, CheckCircle2, Target, Users } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { serviceOffers, couvertureFormules } from '@/lib/services-data'
import { getBrandAudienceSummary } from '@/lib/brand-audience'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Offres & prix annonceurs',
  description:
    'Prix, formats et details des offres Scoop Afrique : couverture terrain, publications premium, campagnes sociales, interviews et partenariats.',
  alternates: { canonical: `${BASE_URL}/services` },
}

export default async function ServicesPage() {
  const audience = await getBrandAudienceSummary()
  const featured = serviceOffers[0]
  const stats = [
    { icon: Users, value: audience.totalSocial.display, label: 'Audience sociale' },
    { icon: BarChart3, value: audience.stats.find((s) => s.key === 'tiktok')?.display ?? '+1M', label: 'TikTok' },
    { icon: Target, value: '5', label: 'Offres modulaires' },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-foreground py-14 text-background sm:py-20 md:py-28">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_18%_18%,rgba(239,35,60,0.65),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.14),transparent_42%)]" />
        <div className="noise-overlay absolute inset-0 opacity-10" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:gap-10 sm:px-8 md:px-12 lg:grid-cols-[1fr_0.82fr] lg:px-20">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-primary sm:text-xs sm:tracking-widest">
              <Dot size="sm" className="text-primary" />
              Offres & prix 2026
            </div>
            <h1 className="mt-4 max-w-4xl break-words text-[clamp(2.35rem,12vw,4.5rem)] font-black leading-[0.98] text-background md:text-6xl" style={{ fontFamily: 'var(--font-headline)' }}>
              Achetez l&apos;audience utile. Choisissez le bon format.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-background/72">
              Couverture terrain, contenus sponsorises, campagnes sociales, interviews et brand deals: chaque offre indique
              son prix, ses livrables, son usage naturel et la prochaine action.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-background/12 bg-background/8 p-4 backdrop-blur">
                  <s.icon className="h-6 w-6 text-primary" />
                  <span className="mt-3 block text-2xl font-black text-primary">{s.value}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-background/58">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Link href={`/services/${featured.slug}`} className="group relative min-h-[320px] overflow-hidden rounded-2xl border border-background/12 bg-background/10 shadow-2xl sm:min-h-[430px]">
            <Image src={featured.image} alt="" fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 520px" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
              <p className="mb-3 inline-flex rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                {featured.price}
              </p>
              <h2 className="max-w-md break-words text-2xl font-black leading-tight sm:text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-headline)' }}>
                {featured.title}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/78">{featured.summary}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
                Voir le detail <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="border-b border-border bg-card py-10">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:px-8 md:grid-cols-3 md:px-12 lg:px-20">
          {['Prix visibles', 'Livrables detailles', 'Brief en 24-48h'].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-widest">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-12 lg:px-20">
          <div className="mb-10 grid gap-4 md:grid-cols-[0.7fr_0.3fr] md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">Catalogue annonceurs</p>
              <h2 className="mt-3 break-words text-3xl font-black leading-tight md:text-5xl" style={{ fontFamily: 'var(--font-headline)' }}>
                Une page claire pour comparer les offres.
              </h2>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              Chaque carte renvoie vers une page detaillee avec usage, livrables, delais, prix et formulaire pre-rempli.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {serviceOffers.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`} className="group block">
                <Card className="h-full overflow-hidden border-border transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl">
                  <div className="grid h-full md:grid-cols-[220px_1fr]">
                    <div className="relative min-h-[180px] bg-muted sm:min-h-[220px]">
                      <Image src={service.image} alt="" fill className="object-cover transition group-hover:scale-105" sizes="260px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent md:bg-black/10" />
                    </div>
                    <div className="p-5">
                      <service.icon className="mb-4 h-8 w-8 text-primary" />
                      <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{service.price}</p>
                      <h2 className="break-words text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-headline)' }}>
                        {service.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.summary}</p>
                      <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary group-hover:underline">
                        Decouvrir le service <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-12 lg:px-20">
          <h2 className="break-words text-3xl font-black text-foreground md:text-5xl" style={{ fontFamily: 'var(--font-headline)' }}>
            Formules couverture terrain
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {couvertureFormules.map((formule) => (
              <Card key={formule.title} className="p-5">
                <p className="text-xl font-black text-primary">{formule.price}</p>
                <h3 className="mt-2 text-lg font-black text-foreground">{formule.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {formule.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <div className="mt-10">
            <CtaButton href="/demander-devis" variant="fillHover" className="w-full justify-center sm:w-auto">
              Construire un dispositif
            </CtaButton>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
