import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Clock, PackageCheck } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { getServiceBySlug, getAllServiceSlugs, couvertureFormules } from '@/lib/services-data'

const BASE_URL = 'https://brands.scoop-afrique.com'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return { title: 'Service non trouve' }
  const title = `${service.title} | Scoop Afrique`
  const description = `${service.tagline} - ${service.summary} Prix : ${service.price}.`
  const url = `${BASE_URL}/services/${slug}`
  const imageUrl = service.image.startsWith('http') ? service.image : `${BASE_URL}${service.image}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      url,
      title,
      description,
      siteName: 'Scoop Afrique',
      type: 'website',
      locale: 'fr_FR',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: service.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export async function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }))
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) notFound()

  const ServiceIcon = service.icon

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article>
        <section className="relative overflow-hidden border-b border-border bg-foreground py-12 text-background sm:py-16 md:py-24">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_18%_18%,rgba(239,35,60,0.65),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.14),transparent_42%)]" />
          <div className="noise-overlay absolute inset-0 opacity-10" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:gap-10 sm:px-8 md:px-12 lg:grid-cols-[0.85fr_1fr] lg:px-20">
            <div className="min-w-0">
              <Link href="/services" className="mb-7 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-background/60 hover:text-primary sm:mb-8 sm:text-xs sm:tracking-widest">
                <ArrowLeft className="h-4 w-4" />
                Toutes les offres
              </Link>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-background/15 bg-background/10">
                  <ServiceIcon className="h-6 w-6 text-primary" />
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-background/58 sm:text-xs sm:tracking-widest">
                  {service.category === 'couverture' ? 'Couverture' : service.category === 'partenariat' ? 'Partenariat' : 'Contenu'}
                </span>
              </div>
              <h1 className="max-w-3xl break-words text-[clamp(2.25rem,11vw,4.5rem)] font-black leading-[0.98] text-background md:text-6xl" style={{ fontFamily: 'var(--font-headline)' }}>
                {service.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-7 text-primary">{service.tagline}</p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-background/70 md:text-base">{service.summary}</p>
            </div>

            <div className="grid gap-5">
              <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-background/12 bg-background/10 shadow-2xl sm:min-h-[360px]">
                <Image src={service.image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 560px" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/16 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="inline-flex max-w-full rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground">
                    {service.price}
                  </p>
                  {service.priceNote && <p className="mt-3 text-sm text-white/72">{service.priceNote}</p>}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-background/12 bg-background/8 p-4">
                  <PackageCheck className="h-5 w-5 text-primary" />
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-background/58">Livrables</p>
                  <p className="mt-1 text-lg font-black text-background">{service.deliverables.length} inclus</p>
                </div>
                <div className="rounded-2xl border border-background/12 bg-background/8 p-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-background/58">Delai</p>
                  <p className="mt-1 break-words text-base font-black text-background sm:text-lg">{service.turnaround ?? 'Sur devis'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-8 md:px-12 md:py-24 lg:grid-cols-[0.68fr_0.32fr] lg:px-20">
          <div className="space-y-10">
            <section>
              <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">Pourquoi ce service ?</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {service.why.map((item) => (
                  <Card key={item} className="border-border p-4">
                    <CheckCircle2 className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">Comment nous livrons</h2>
              <div className="space-y-3">
                {service.howWeDeliver.map((step, i) => (
                  <div key={step} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">Livrables inclus</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {service.deliverables.map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-xl border border-border bg-muted/25 p-3 text-sm text-muted-foreground">
                    <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {service.slug === 'couverture-mediatique' && (
              <section>
                <h2 className="mb-6 font-sans text-base font-bold uppercase tracking-wider text-foreground">Formules disponibles</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {couvertureFormules.map((formule) => (
                    <Card key={formule.title} className="overflow-hidden border-border">
                      <div className="relative aspect-video w-full bg-muted">
                        <Image src={formule.image} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                      </div>
                      <div className="p-5">
                        <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-foreground">{formule.title}</h3>
                        <p className="mb-3 font-sans text-xl font-black text-primary">{formule.price}</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {formule.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <Card className="border-primary/20 bg-primary/5 p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Budget</p>
              <p className="mt-2 text-3xl font-black text-primary">{service.price}</p>
              {service.priceNote && <p className="mt-2 text-sm text-muted-foreground">{service.priceNote}</p>}
              <div className="mt-6 flex flex-col gap-3">
                <CtaButton href={`/demander-devis?service=${service.slug}`} variant="fillHover" className="w-full justify-center">
                  Demander un devis
                </CtaButton>
                <CtaButton href="/contact" variant="outline" className="w-full justify-center">
                  Nous contacter
                </CtaButton>
              </div>
            </Card>

            <Card className="border-border p-6">
              <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-wider text-foreground">Ideal pour</h2>
              <div className="flex flex-wrap gap-2">
                {service.idealFor.map((item) => (
                  <span key={item} className="rounded-full border border-border bg-muted px-3 py-2 text-xs font-medium text-foreground">
                    {item}
                  </span>
                ))}
              </div>
            </Card>

            {service.priceRationale && (
              <Card className="border-border p-6">
                <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-foreground">Approche tarifaire</h2>
                <p className="text-sm leading-6 text-muted-foreground">{service.priceRationale}</p>
              </Card>
            )}
          </aside>
        </section>
      </article>

      <Footer />
    </main>
  )
}
