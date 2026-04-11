'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AnimatedSection } from '@/components/animated-section'
import { editorialPrograms } from '@/lib/programs-data'

export function ProgramsTeaserSection() {
  const featured = editorialPrograms.slice(0, 4)

  return (
    <section className="border-b border-[var(--surface-border)] bg-[var(--surface)] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div className="mb-10 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="mb-3 font-sans text-lg font-semibold uppercase tracking-wider text-foreground">
              Programmes éditoriaux
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Des formats récurrents — jeu avec célébrités, interviews longues, micro-trottoirs, reportages terrain, portraits
              d’entrepreneurs — conçus pour l’audience mobile afro-francophone. Idéal si vous cherchez un partenariat sur la
              durée plutôt qu’une simple publication ponctuelle.
            </p>
          </div>
          <Link
            href="/programmes"
            className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary transition-colors hover:text-foreground"
          >
            Tous les programmes
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, i) => (
            <AnimatedSection key={p.slug} animation="fade-in-up" delay={i * 0.07}>
              <Link
                href={`/programmes/${p.slug}`}
                className="group block rounded-xl border border-[var(--surface-border)] bg-background p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-md"
              >
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {p.pillar}
                </span>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-tight text-foreground">{p.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">{p.cardSummary}</p>
                <span className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-primary group-hover:underline">
                  Sponsoring →
                </span>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
