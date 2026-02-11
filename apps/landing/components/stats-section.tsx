'use client'

import { Users, Eye, Globe, Smartphone } from 'lucide-react'
import { MarqueeBand } from 'scoop'

const stats = [
  { icon: Users, value: '1,25 M+', label: 'Abonnés' },
  { icon: Eye, value: '300 M+', label: 'Vues' },
  { icon: Globe, value: '12+', label: 'Pays' },
  { icon: Smartphone, value: '5', label: 'Plateformes' },
]

export function StatsSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-card py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-12 lg:px-20">
        <p className="mb-8 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground sm:mb-10">
          Chiffres clés — Audience & portée
        </p>
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <s.icon className="mb-3 h-8 w-8 text-primary sm:mb-4 sm:h-10 sm:w-10" />
              <span className="block font-sans text-2xl font-black text-primary sm:text-3xl md:text-4xl">{s.value}</span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <MarqueeBand text="TIKTOK — FACEBOOK — INSTAGRAM — YOUTUBE — THREADS" direction="right" speed={20} />
    </section>
  )
}
