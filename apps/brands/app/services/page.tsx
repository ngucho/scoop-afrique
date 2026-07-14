import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BarChart3, Users, Target } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { serviceOffers, couvertureFormules } from '@/lib/services-data'
import { getBrandAudienceSummary } from '@/lib/brand-audience'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Services annonceurs',
  description:
    'Couvertures terrain, publications premium, campagnes sociales, interviews et partenariats pour marques et institutions en Afrique.',
  alternates: { canonical: `${BASE_URL}/services` },
}

export default async function ServicesPage() {
  const audience = await getBrandAudienceSummary()
  const stats = [
    { icon: Users, value: audience.totalSocial.display, label: 'Audience sociale' },
    { icon: BarChart3, value: audience.siteVisits.display, label: 'Visites mensuelles site' },
    { icon: Target, value: '5', label: 'Offres modulaires' },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-card py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-20">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
            <Dot size="sm" className="text-primary" />
            Services annonceurs
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-foreground md:text-6xl" style={{ fontFamily: 'var(--font-headline)' }}>
            Des campagnes qui parlent la langue de l&apos;audience africaine.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-muted-foreground">
            Couverture terrain, contenus sponsorises, campagnes sociales, interviews et brand deals: chaque offre est pensee
            pour creer de la confiance, de la repetition et du contexte.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <Card key={s.label} className="p-4">
                <s.icon className="h-6 w-6 text-primary" />
                <span className="mt-3 block text-2xl font-black text-primary">{s.value}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-20">
          <div className="grid gap-5 md:grid-cols-2">
            {serviceOffers.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`} className="group block">
                <Card className="h-full overflow-hidden border-border transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl">
                  <div className="grid h-full md:grid-cols-[220px_1fr]">
                    <div className="relative min-h-[220px] bg-muted">
                      <Image src={service.image} alt="" fill className="object-cover transition group-hover:scale-105" sizes="260px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent md:bg-black/10" />
                    </div>
                    <div className="p-5">
                      <service.icon className="mb-4 h-8 w-8 text-primary" />
                      <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{service.price}</p>
                      <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-headline)' }}>
                        {service.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.summary}</p>
                      <span className="mt-5 inline-block font-mono text-xs uppercase tracking-widest text-primary group-hover:underline">
                        Decouvrir le service
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
        <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-20">
          <h2 className="text-3xl font-black text-foreground md:text-5xl" style={{ fontFamily: 'var(--font-headline)' }}>
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
            <CtaButton href="/demander-devis" variant="fillHover">
              Construire un dispositif
            </CtaButton>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
