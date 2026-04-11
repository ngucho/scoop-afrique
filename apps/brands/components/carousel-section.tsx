'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  { src: '/images/carousel-1.jpg', title: 'Couverture événement', caption: 'Événements & lancements' },
  { src: '/images/carousel-2.png', title: 'Contenu viral', caption: 'TikTok, Instagram, Facebook' },
  { src: '/images/carousel-3.png', title: 'Reportages', caption: 'Interviews & documentaires' },
  { src: '/images/carousel-4.jpg', title: 'Partenariats', caption: 'Marques & artistes' },
  { src: '/images/carousel-5.jpg', title: 'Audience panafricaine', caption: '12+ pays' },
]

export function CarouselSection() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [])

  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length)

  return (
    <section className="relative overflow-hidden border-y border-[var(--surface-border)] bg-[var(--surface)] py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-12 lg:px-20">
        <h2 className="mb-6 font-sans text-lg font-semibold uppercase tracking-wider text-foreground">
          Nos réalisations
        </h2>
      </div>
      <div className="relative w-full px-0 sm:px-4 md:px-8">
        <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-muted">
          <Image
            key={slides[index].src}
            src={slides[index].src}
            alt={slides[index].title}
            fill
            className="object-cover transition-opacity duration-500"
            sizes="(max-width: 1024px) 100vw, 1024px"
            onError={(e) => {
              const t = e.target as HTMLImageElement
              t.style.display = 'none'
              t.parentElement?.classList.add('js-fallback-visible')
            }}
          />
          <div className="absolute inset-0 hidden flex-col items-center justify-center gap-2 bg-muted [.js-fallback-visible_&]:!flex">
            <span className="font-sans text-lg font-bold text-muted-foreground">{slides[index].title}</span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground/80">{slides[index].caption}</span>
          </div>
          <div className="absolute bottom-4 left-4 rounded bg-[var(--glass-bg)] px-3 py-2 backdrop-blur-[var(--glass-blur)]">
            <p className="font-sans font-bold text-foreground">{slides[index].title}</p>
            <p className="font-mono text-xs text-muted-foreground">{slides[index].caption}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => go(-1)}
          className="absolute left-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--glass-bg)] text-foreground transition-colors hover:border-primary hover:text-primary md:left-4"
          aria-label="Slide précédent"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--glass-bg)] text-foreground transition-colors hover:border-primary hover:text-primary md:right-4"
          aria-label="Slide suivant"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <div className="mt-6 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-primary' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
              }`}
              aria-label={`Aller au slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
