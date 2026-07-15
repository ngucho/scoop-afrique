const values = [
  {
    number: '01',
    title: 'Souverainete narrative',
    description: "Nous refusons que l'Afrique soit seulement un decor ou un marche. Elle est le sujet, la source et le centre du recit.",
  },
  {
    number: '02',
    title: 'Dignite publique',
    description: 'Nos contenus doivent elever le debat, respecter les personnes et donner envie de construire une societe plus forte.',
  },
  {
    number: '03',
    title: 'Energie de la rue',
    description: 'Nous gardons le rythme du terrain: direct, mobile, populaire, mais jamais paresseux ni meprisant.',
  },
]

export function ValuesSection() {
  return (
    <section className="border-b border-border bg-card py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-20">
        <div className="mb-10 max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">ADN editorial</p>
          <h2 className="mt-3 text-3xl font-black text-foreground md:text-5xl" style={{ fontFamily: 'var(--font-headline)' }}>
            Ce que nous protegeons dans chaque campagne.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {values.map((value) => (
            <div key={value.number} className="rounded-2xl border border-border bg-background p-5">
              <span className="block text-5xl font-black text-primary/20" style={{ fontFamily: 'var(--font-headline)' }}>
                {value.number}
              </span>
              <h3 className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-foreground">{value.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
