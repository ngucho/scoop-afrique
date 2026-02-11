'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Dot } from 'scoop'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  { src: '/placeholders/carousel-1.jpg', title: 'Couverture événement', caption: 'Événements & lancements' },
  { src: '/placeholders/carousel-2.jpg', title: 'Contenu viral', caption: 'TikTok, Instagram, Facebook' },
  { src: '/placeholders/carousel-3.jpg', title: 'Reportages', caption: 'Interviews & documentaires' },
  { src: '/placeholders/carousel-4.jpg', title: 'Partenariats', caption: 'Marques & artistes' },
  { src: '/placeholders/carousel-5.jpg', title: 'Audience panafricaine', caption: '12+ pays' },
]

export function CarouselSection() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [])

  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length)

  return (
    <section className="relative overflow-hidden border-y border-border bg-card py-12 sm:py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-12 lg:px-20">
        <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground sm:mb-4">
          <Dot size="sm" className="text-primary" />
          Nos réalisations
        </div>
        <h2 className="mb-6 font-sans text-2xl font-black uppercase tracking-tight text-foreground sm:mb-10 sm:text-3xl md:text-4xl">
          Une audience qui <span className="text-primary">réagit</span>
        </h2>
      </div>
      <div className="relative mx-auto max-w-5xl px-2 sm:px-4 md:px-8">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
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
          <div className="absolute bottom-4 left-4 rounded bg-background/80 px-3 py-2 backdrop-blur">
            <p className="font-sans font-bold text-foreground">{slides[index].title}</p>
            <p className="font-mono text-xs text-muted-foreground">{slides[index].caption}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => go(-1)}
          className="absolute left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground transition-colors hover:border-primary hover:text-primary md:left-4"
          aria-label="Slide précédent"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground transition-colors hover:border-primary hover:text-primary md:right-4"
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
              className={`h-2 w-2 rounded-full transition-all ${
                i === index ? 'w-8 bg-primary' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
              }`}
              aria-label={`Aller au slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
