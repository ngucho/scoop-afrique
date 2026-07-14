import type { Metadata } from 'next'
import { Footer } from '@/components/footer'
import { Heading, Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { serviceOffers } from '@/lib/services-data'
import { getBrandAudienceSummary } from '@/lib/brand-audience'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Tarifs 2026 annonceurs',
  description:
    "Grille 2026 Scoop Afrique: publications premium, couvertures terrain, campagnes sociales, interviews et partenariats de marque pour une audience panafricaine massive.",
  alternates: { canonical: `${BASE_URL}/tarifs` },
}

export default async function TarifsPage() {
  const audience = await getBrandAudienceSummary()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:px-12 md:py-20">
        <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Dot size="sm" className="text-primary" />
          Grille annonceurs 2026 · FCFA
        </div>
        <Heading as="h1" level="h1" className="mb-4">
          Tarifs <span className="text-primary">repositionnes</span>
        </Heading>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Scoop Afrique n&apos;est plus un media en lancement. Nos prix refletent une audience sociale de{' '}
          <strong className="text-foreground">{audience.totalSocial.display}</strong>, une capacite de production terrain et
          une ligne editoriale qui protege la confiance du public.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {serviceOffers.map((offer) => (
            <Card key={offer.slug} className="border-border p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{offer.category}</p>
                  <h2 className="mt-2 text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-headline)' }}>
                    {offer.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{offer.summary}</p>
                </div>
                <p className="shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-black text-primary-foreground">
                  {offer.price}
                </p>
              </div>
              <ul className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                {offer.deliverables.slice(0, 4).map((item) => (
                  <li key={item} className="flex gap-2">
                    <Dot size="sm" className="mt-1.5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <Card className="mt-10 border-primary/20 bg-primary/5 p-6 md:p-8">
          <Heading as="h2" level="h2" className="mb-4">
            Conditions commerciales
          </Heading>
          <div className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            <p>Acompte recommande: 50% a la signature, solde a la livraison ou selon contrat.</p>
            <p>Hors Abidjan, les frais terrain, transport et hebergement sont ajoutes au devis.</p>
            <p>Les exclusivites, programmes et campagnes multi-pays se chiffrent sur brief.</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <CtaButton href="/demander-devis" variant="fillHover">
              Demander un devis
            </CtaButton>
            <CtaButton href="/services" variant="outline">
              Voir les services
            </CtaButton>
          </div>
        </Card>
      </article>
      <Footer />
    </main>
  )
}
