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
          Scoop Afrique est un média numérique né à Abidjan en 2025. Nous mélangeons rigueur d’information, esthétique
          soignée et codes du divertissement pour parler à une audience majoritairement entre 18 et 34 ans, très présente en
          Côte d’Ivoire et dans la diaspora.
        </p>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Ce que nous faisons pour les marques :</strong> couverture d’événements,
          publications sponsorisées transparentes, campagnes artistiques, interviews et partenariats récurrents — toujours
          intégrés à notre ligne éditoriale, avec des livrables clairs et des métriques quand vous en avez besoin.
        </p>
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Vision :</strong> être le média de référence de la jeunesse africaine
          francophone.
          <br />
          <strong className="text-foreground">Mission :</strong> donner une voix et une vitrine à l’Afrique avec des contenus
          audiovisuels honnêtes, modernes et partageables.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <CtaButton href="/a-propos" variant="outline">
            À propos & équipe
          </CtaButton>
          <CtaButton href="/tarifs" variant="outline">
            Transparence tarifaire
          </CtaButton>
        </div>
      </div>
    </section>
  )
}
