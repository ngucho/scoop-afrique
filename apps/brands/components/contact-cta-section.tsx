'use client'

import { CtaButton } from '@/components/cta-button'

export function ContactCtaSection() {
  return (
    <section className="border-b border-[var(--surface-border)] bg-background py-16 md:py-20">
      <div className="mx-auto max-w-2xl px-6 text-center md:px-12 lg:px-20">
        <h2 className="mb-3 font-sans text-lg font-bold uppercase tracking-tight text-foreground sm:text-xl">
          Prêt à <span className="text-primary">collaborer</span> ?
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Demandez un devis, présentez votre projet ou échangez avec notre équipe. Réponse sous 24–48 h.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <CtaButton href="/contact" variant="fillHover">
            Demander un devis
          </CtaButton>
          <CtaButton href="mailto:contact@scoop-afrique.com" variant="outline" external>
            contact@scoop-afrique.com
          </CtaButton>
        </div>
      </div>
    </section>
  )
}
