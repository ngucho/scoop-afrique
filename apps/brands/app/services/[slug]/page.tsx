import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { getServiceBySlug, getAllServiceSlugs, couvertureFormules } from '@/lib/services-data'

const BASE_URL = 'https://brands.scoop-afrique.com'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return { title: 'Service non trouvé' }
  const title = `${service.title} | Scoop Afrique`
  const description = `${service.tagline} — ${service.summary} Tarifs : ${service.price}.`
  const url = `${BASE_URL}/services/${slug}`
  // Service image for OG (absolute URL for social sharing)
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
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:px-12 md:py-16">
        {/* Hero */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-primary/5">
              <ServiceIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {service.category === 'couverture' ? 'Couverture' : service.category === 'partenariat' ? 'Partenariat' : 'Contenu'}
              </span>
            </div>
          </div>
          <h1 className="mb-3 font-sans text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {service.title}
          </h1>
          <p className="mb-6 text-lg text-primary font-semibold">
            {service.tagline}
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-sans text-2xl font-black text-primary">{service.price}</span>
            {service.priceNote && (
              <span className="text-sm text-muted-foreground">{service.priceNote}</span>
            )}
          </div>
        </div>

        {/* Image */}
        <div className="relative mb-12 aspect-video w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-muted">
          <Image
            src={service.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
            priority
          />
        </div>

        {/* Résumé */}
        <Card className="mb-12 border-[var(--surface-border)] p-6">
          <h2 className="mb-3 font-sans text-base font-bold uppercase tracking-wider text-foreground">
            En bref
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {service.summary}
          </p>
        </Card>

        {/* Pourquoi ce service */}
        <section className="mb-12">
          <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">
            Pourquoi ce service ?
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Ce service répond aux besoins suivants :
          </p>
          <ul className="space-y-2">
            {service.why.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Comment nous livrons */}
        <section className="mb-12">
          <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">
            Comment nous livrons
          </h2>
          <ol className="space-y-3">
            {service.howWeDeliver.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Livrables */}
        <section className="mb-12">
          <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">
            Livrables inclus
          </h2>
          <ul className="space-y-2">
            {service.deliverables.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Idéal pour */}
        <section className="mb-12">
          <h2 className="mb-4 font-sans text-base font-bold uppercase tracking-wider text-foreground">
            Idéal pour
          </h2>
          <div className="flex flex-wrap gap-2">
            {service.idealFor.map((item, i) => (
              <span
                key={i}
                className="rounded-full border border-[var(--surface-border)] bg-muted px-4 py-2 text-xs font-medium text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Formules couverture (si applicable) */}
        {service.slug === 'couverture-mediatique' && (
          <section className="mb-12">
            <h2 className="mb-6 font-sans text-base font-bold uppercase tracking-wider text-foreground">
              Formules disponibles
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {couvertureFormules.map((formule) => (
                <Card key={formule.title} className="overflow-hidden border-[var(--surface-border)]">
                  <div className="relative aspect-video w-full bg-muted">
                    <Image
                      src={formule.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-foreground">
                      {formule.title}
                    </h3>
                    <p className="mb-3 font-sans text-xl font-black text-primary">{formule.price}</p>
                    <ul className="list-none space-y-1 text-xs text-muted-foreground">
                      {formule.items.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Délai */}
        {service.turnaround && (
          <section className="mb-12">
            <h2 className="mb-2 font-sans text-base font-bold uppercase tracking-wider text-foreground">
              Délai de livraison
            </h2>
            <p className="text-sm text-muted-foreground">{service.turnaround}</p>
          </section>
        )}

        {/* Prix : notre approche */}
        {service.priceRationale && (
          <Card className="mb-12 border-primary/20 bg-primary/5 p-6">
            <h2 className="mb-3 font-sans text-base font-bold uppercase tracking-wider text-foreground">
              Notre approche tarifaire
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {service.priceRationale}
            </p>
          </Card>
        )}

        {/* CTA */}
        <Card className="border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="mb-3 font-sans text-base font-bold uppercase tracking-wider text-foreground">
            Prêt à lancer votre projet ?
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Demandez un devis personnalisé. Réponse sous 24–48 h.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <CtaButton href={`/demander-devis?service=${service.slug}`} variant="fillHover">
              Demander un devis
            </CtaButton>
            <CtaButton href="/contact" variant="outline">
              Nous contacter
            </CtaButton>
          </div>
        </Card>
      </article>

      <Footer />
    </main>
  )
}
