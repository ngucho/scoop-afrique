'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

const slides = [
  {
    src: '/images/offre-couverture.jpg',
    title: 'Terrain',
    caption: 'Une equipe dans la rue, sur scene, au coeur du moment.',
    metric: 'Event coverage',
  },
  {
    src: '/images/offre-campagnes.jpg',
    title: 'Social first',
    caption: 'Des formats penses pour etre regardes, partages et commentes.',
    metric: 'TikTok / Reels',
  },
  {
    src: '/images/video-premium.jpg',
    title: 'Recit',
    caption: 'Interviews, reportages et angles qui donnent du poids au message.',
    metric: 'Editorial proof',
  },
  {
    src: '/images/podcast-interview.jpg',
    title: 'Influence',
    caption: 'Marques, artistes et institutions integres avec les bons codes.',
    metric: 'Brand moves',
  },
  {
    src: '/images/offre-partenariat.jpg',
    title: 'Afrique',
    caption: 'Un mouvement jeune, francophone, mobile et ambitieux.',
    metric: '12+ pays',
  },
]

export function CarouselSection() {
  const [index, setIndex] = useState(0)
  const active = slides[index]

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5200)
    return () => clearInterval(t)
  }, [])

  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length)

  return (
    <section className="relative overflow-hidden bg-foreground text-background">
      <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_25%_20%,rgba(239,35,60,0.7),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_45%)]" />
      <div className="noise-overlay absolute inset-0 opacity-10" />

      <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:min-h-[720px] md:grid-cols-[0.95fr_1.05fr] md:px-12 md:py-20 lg:px-20">
        <div className="z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-background/75 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            Proof reel
          </div>
          <h2 className="font-sans text-4xl font-black uppercase leading-[0.98] tracking-normal text-background sm:text-5xl md:text-6xl">
            La marque entre dans la conversation.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-background/70 md:text-base">
            Pas une vitrine froide : des images, des voix, des scenes et des formats qui donnent envie de suivre le
            prochain episode.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => go(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-background/15 bg-background/10 text-background transition hover:border-primary hover:text-primary"
              aria-label="Slide precedent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-background/15 bg-background/10 text-background transition hover:border-primary hover:text-primary"
              aria-label="Slide suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="ml-2 flex gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-primary' : 'w-3 bg-background/30 hover:bg-background/60'}`}
                  aria-label={`Aller au slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative min-h-[500px] md:min-h-[560px]">
          <div className="absolute left-2 top-4 z-20 rounded-2xl border border-background/15 bg-background/12 px-4 py-3 text-background shadow-2xl backdrop-blur md:left-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-background/60">{active.metric}</p>
            <p className="mt-1 font-sans text-2xl font-black uppercase">{active.title}</p>
          </div>

          <div className="absolute inset-x-0 top-10 mx-auto aspect-[4/5] max-w-[420px] overflow-hidden rounded-[2rem] border border-background/10 bg-background/10 shadow-[0_50px_120px_rgba(0,0,0,0.45)] md:right-0 md:mx-0 md:max-w-[520px]">
            <Image
              key={active.src}
              src={active.src}
              alt={active.title}
              fill
              className="animate-brand-pan object-cover"
              sizes="(max-width: 768px) 92vw, 520px"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/8 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-background md:p-8">
              <p className="max-w-sm text-base font-medium leading-relaxed md:text-lg">{active.caption}</p>
            </div>
          </div>

          <div className="absolute bottom-2 right-0 z-20 max-w-[260px] rounded-2xl border border-background/15 bg-background p-4 text-foreground shadow-2xl md:bottom-0 md:right-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Next move</p>
              <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <p className="font-sans text-sm font-bold uppercase leading-tight">
              Transformer une campagne en sequence que l&apos;audience suit.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
