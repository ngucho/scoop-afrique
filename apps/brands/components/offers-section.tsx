import Link from 'next/link'
import Image from 'next/image'
import { CtaButton } from '@/components/cta-button'
import { serviceOffers } from '@/lib/services-data'

export function OffersSection() {
  return (
    <section id="offres" className="relative scroll-mt-28 overflow-hidden bg-background py-18 md:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-20">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.5fr_0.5fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Offres annonceurs</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-5xl" style={{ fontFamily: 'var(--font-headline)' }}>
              Achetez de l&apos;attention utile, pas juste une impression.
            </h2>
          </div>
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            Nos offres sont pensees pour une audience africaine mobile: video courte, terrain, article, activation sociale
            et partenariat recurrent. Chaque pack part d&apos;un objectif clair: visibilite, credibilite, mobilisation ou presence durable.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {serviceOffers.map((offer, index) => (
            <Link
              key={offer.slug}
              href={`/services/${offer.slug}`}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl ${
                index === 0 ? 'lg:col-span-2 lg:row-span-2' : 'lg:col-span-1'
              }`}
            >
              <div className={`${index === 0 ? 'aspect-[16/13]' : 'aspect-[4/5]'} relative bg-muted`}>
                <Image
                  src={offer.image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <div className="mb-3 inline-flex rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground">
                    {offer.price}
                  </div>
                  <h3 className="text-xl font-black leading-tight" style={{ fontFamily: 'var(--font-headline)' }}>
                    {offer.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/78">{offer.tagline}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-muted-foreground">
            Besoin d&apos;une proposition specifique? On assemble les formats selon votre objectif, votre calendrier et votre marche.
          </p>
          <CtaButton href="/demander-devis" variant="fillHover">
            Demander un devis
          </CtaButton>
        </div>
      </div>
    </section>
  )
}
