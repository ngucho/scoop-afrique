import type { BrandAudienceSummary } from '@/lib/brand-audience'

export function StatsSection({ audience }: { audience: BrandAudienceSummary }) {
  const stats = [audience.totalSocial, ...audience.stats]

  return (
    <section className="relative overflow-hidden border-y border-border bg-card py-14 md:py-18">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-20">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Audience verifiee</p>
            <h2 className="mt-2 text-2xl font-black text-foreground md:text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>
              Une puissance sociale, pas une promesse.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">{audience.sourceLabel}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.key} className="rounded-xl border border-border bg-background p-4">
              <p className="text-[clamp(1.8rem,4vw,3.2rem)] font-black leading-none text-primary" style={{ fontFamily: 'var(--font-headline)' }}>
                {stat.display}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
