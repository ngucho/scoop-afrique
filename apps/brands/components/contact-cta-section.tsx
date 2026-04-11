'use client'

import { CtaButton } from '@/components/cta-button'

export function ContactCtaSection() {
  return (
    <section className="border-b border-[var(--surface-border)] bg-background py-16 md:py-20">
      <div className="mx-auto max-w-2xl px-6 text-center md:px-12 lg:px-20">
        <h2 className="mb-3 font-sans text-lg font-bold uppercase tracking-tight text-foreground sm:text-xl">
          Un brief, une réponse claire
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Décrivez votre objectif, votre timing et votre budget indicatif : nous revenons vers vous sous 24–48 h avec une
          proposition ou un créneau d’appel. Acompte 50 % à la signature sur la plupart des prestations (grille 2026).
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <CtaButton href="/demander-devis" variant="fillHover">
            Demander un devis
          </CtaButton>
          <CtaButton href="/contact" variant="outline">
            Contact & WhatsApp
          </CtaButton>
        </div>
      </div>
    </section>
  )
}
