'use client'

import Link from 'next/link'
import { ArrowRight, Radio } from 'lucide-react'
import { AnimatedSection } from '@/components/animated-section'
import { editorialPrograms } from '@/lib/programs-data'

export function ProgramsTeaserSection() {
  const featured = editorialPrograms.slice(0, 4)

  return (
    <section className="relative overflow-hidden border-b border-[var(--surface-border)] bg-background py-16 md:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rounded-full border border-primary/20" />
      <div className="pointer-events-none absolute -right-10 top-28 h-48 w-48 rounded-full border border-foreground/10" />

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div className="grid gap-10 md:grid-cols-[0.82fr_1.18fr] md:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Radio className="h-3.5 w-3.5 text-primary" aria-hidden />
              Programmes vivants
            </div>
            <h2 className="font-sans text-4xl font-black uppercase leading-[0.92] tracking-normal text-foreground sm:text-5xl">
              Des rendez-vous que les marques peuvent habiter.
            </h2>
          </div>
          <div className="max-w-2xl md:justify-self-end">
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Jeux, interviews, micro-trottoirs, reportages et portraits : des formats recurrents, faciles a suivre,
              construits pour la video mobile et assez solides pour porter une campagne sur plusieurs semaines.
            </p>
            <Link
              href="/programmes"
              className="group mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary transition-colors hover:text-foreground"
            >
              Tous les programmes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, i) => (
            <AnimatedSection key={p.slug} animation="fade-in-up" delay={i * 0.07}>
              <Link
                href={`/programmes/${p.slug}`}
                className={`group relative block min-h-[260px] overflow-hidden rounded-[1.25rem] border border-[var(--surface-border)] bg-[var(--surface)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 ${
                  i % 2 === 1 ? 'lg:mt-10' : ''
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-primary/80" />
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-primary/20 transition-transform duration-500 group-hover:scale-125" />
                <span className="mb-5 block font-mono text-[10px] uppercase tracking-widest text-primary">{p.pillar}</span>
                <h3 className="mb-3 font-sans text-xl font-black uppercase leading-none tracking-normal text-foreground">
                  {p.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-4">{p.cardSummary}</p>
                <span className="absolute bottom-5 left-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
                  Sponsoring
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
