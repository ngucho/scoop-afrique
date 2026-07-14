'use client'

import { MessageCircle, Send } from 'lucide-react'
import { CtaButton } from '@/components/cta-button'

export function ContactCtaSection() {
  return (
    <section className="relative overflow-hidden bg-foreground py-16 text-background md:py-24">
      <div className="absolute inset-0 opacity-35 [background:radial-gradient(circle_at_15%_20%,rgba(239,35,60,0.75),transparent_24%),radial-gradient(circle_at_82%_72%,rgba(255,255,255,0.18),transparent_26%)]" />
      <div className="noise-overlay absolute inset-0 opacity-10" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-12 lg:px-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-background/75">
            <Send className="h-3.5 w-3.5 text-primary" aria-hidden />
            Brief room
          </div>
          <h2 className="font-sans text-4xl font-black uppercase leading-[0.9] tracking-normal text-background sm:text-5xl md:text-6xl">
            Un brief clair. Une reponse exploitable.
          </h2>
        </div>

        <div className="rounded-[1.5rem] border border-background/15 bg-background p-5 text-foreground shadow-2xl md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <MessageCircle className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="font-sans text-sm font-black uppercase">Reponse 24-48 h</p>
              <p className="text-xs text-muted-foreground">Objectif, timing, budget, livrables.</p>
            </div>
          </div>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            On transforme votre demande en proposition concrete : plateforme, format, calendrier, niveau de production et
            indicateurs de suivi. Les prix restent visibles dans chaque offre, le devis final precise le perimetre.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CtaButton href="/demander-devis" variant="fillHover">
              Demander un devis
            </CtaButton>
            <CtaButton href="/contact" variant="outline">
              Contact & WhatsApp
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  )
}
