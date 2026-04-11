'use client'

const stats = [
  { value: '+1,4 M', label: 'Abonnés cumulés' },
  { value: '910 K', label: 'TikTok' },
  { value: '410 K', label: 'Facebook (monétisé)' },
  { value: '12+', label: 'Pays' },
]

export function StatsSection() {
  return (
    <section className="border-b border-[var(--surface-border)] bg-[var(--surface)] py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <p className="mb-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Audience — mars 2026 · analytics internes plateformes (même source que notre media kit)
        </p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <span className="block font-sans text-xl font-bold text-primary sm:text-2xl">{s.value}</span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
