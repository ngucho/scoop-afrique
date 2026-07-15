import { CtaButton } from '@/components/cta-button'

export function WhoWeAreSection() {
  return (
    <section className="border-b border-border bg-background py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 md:px-12 lg:grid-cols-[0.42fr_0.58fr] lg:px-20">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Notre position</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-5xl" style={{ fontFamily: 'var(--font-headline)' }}>
            L&apos;Afrique au centre, la dignite comme boussole.
          </h2>
        </div>
        <div className="space-y-5 text-sm leading-7 text-muted-foreground md:text-base">
          <p>
            Scoop Afrique est un media digital panafricain fonde a Abidjan. Notre travail part d&apos;une conviction simple:
            les histoires qui construisent le continent doivent etre racontees par celles et ceux qui vivent ses urgences,
            ses rues, ses ambitions et ses contradictions.
          </p>
          <p>
            Pour les marques, cela change tout. Nous ne vendons pas seulement de l&apos;espace publicitaire: nous construisons
            des campagnes qui respectent l&apos;audience, la culture et les enjeux d&apos;une generation qui veut participer a une
            nation prospere, informee et fiere.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <CtaButton href="/a-propos" variant="outline">
              Lire notre manifeste
            </CtaButton>
            <CtaButton href="/services" variant="outline">
              Voir les offres
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  )
}
