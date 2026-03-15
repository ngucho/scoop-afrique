'use client'

import { useState } from 'react'

const values = [
  { number: '01', title: 'Authenticité', description: 'Une information vraie, vérifiée, sans filtre ni compromis.' },
  { number: '02', title: 'Accessibilité', description: 'Un contenu pensé pour tous, partout, sur tous les écrans.' },
  { number: '03', title: 'Innovation', description: "Les codes du digital au service de l'information africaine." },
]

export function ValuesSection() {
  const [activeValue, setActiveValue] = useState(0)

  return (
    <section className="border-b border-[var(--surface-border)] bg-[var(--surface)] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <h2 className="mb-10 font-sans text-lg font-semibold uppercase tracking-wider text-foreground">
          Nos valeurs
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((value, index) => (
            <div
              key={value.number}
              className={`group cursor-pointer border-t border-[var(--surface-border)] pt-6 transition-all duration-300 hover:border-primary ${
                activeValue === index ? 'border-primary' : ''
              }`}
              onMouseEnter={() => setActiveValue(index)}
            >
              <span
                className={`mb-3 block font-mono text-6xl font-black transition-colors duration-300 ${
                  activeValue === index ? 'text-primary' : 'text-muted-foreground/20 group-hover:text-muted-foreground/40'
                }`}
              >
                {value.number}
              </span>
              <h3 className="mb-2 font-sans text-base font-bold uppercase tracking-wider text-foreground">
                {value.title}
              </h3>
              <p className="text-sm text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
