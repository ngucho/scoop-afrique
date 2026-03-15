'use client'

import { MarqueeBand } from 'scoop'
import { CtaButton } from '@/components/cta-button'

export function LeadCtaSection() {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-24 md:py-32">
      <MarqueeBand
        text="PARTENAIRES — ANNONCEURS — MARQUES — ÉVÉNEMENTS — CAMPAGNES — CONTACT"
        direction="left"
        speed={30}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 font-sans text-2xl font-black uppercase leading-tight tracking-tight text-foreground sm:mb-6 sm:text-3xl md:text-4xl lg:text-5xl">
            Prêt à <span className="text-primary">collaborer</span> ?
          </h2>
          <p className="mb-8 text-base text-muted-foreground sm:mb-10 sm:text-lg">
            Demandez un devis, présentez votre projet ou échangez avec notre équipe. Réponse sous 24–48 h.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <CtaButton href="/contact" variant="fillHover" size="lg">
              Demander un devis
            </CtaButton>
            <CtaButton href="mailto:contact@scoop-afrique.com" variant="outline" external>
              contact@scoop-afrique.com
            </CtaButton>
          </div>
        </div>
      </div>
      <MarqueeBand
        text="SCOOP AFRIQUE — ABIDJAN — COTE D'IVOIRE — PANAFRICAIN"
        direction="right"
        speed={25}
      />
    </section>
  )
}
