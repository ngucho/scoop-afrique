'use client'

import { CtaButton } from '@/components/cta-button'

export function WhoWeAreSection() {
  return (
    <section className="border-b border-[var(--surface-border)] bg-background py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20">
        <h2 className="mb-6 font-sans text-lg font-semibold uppercase tracking-wider text-foreground">
          Qui sommes-nous ?
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Scoop Afrique est un média panafricain basé en Côte d&apos;Ivoire qui allie rapidité, fiabilité et créativité
          dans le traitement de l&apos;information. Avec plus de 300 millions de vues sur nos réseaux sociaux, nous faisons
          partie des nouvelles voix médiatiques les plus influentes du continent.
        </p>
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Vision :</strong> Devenir le média de référence de la jeunesse africaine francophone.
          <br />
          <strong className="text-foreground">Mission :</strong> Donner une voix et une vitrine à l&apos;Afrique en produisant des contenus audiovisuels impactants.
        </p>
        <CtaButton href="/a-propos" variant="outline">
          En savoir plus
        </CtaButton>
      </div>
    </section>
  )
}
