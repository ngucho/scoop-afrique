'use client'

import { useEffect, useRef, useState } from 'react'
import { GlitchText, FillHoverAnchor } from 'scoop'

const socialPlatforms = [
  { name: "TikTok", handle: "@Scoop.Afrique", href: "https://tiktok.com/@Scoop.Afrique", followers: "837.5K", gradient: "from-cyan-400 via-pink-500 to-red-500", description: "Videos virales & trends africains" },
  { name: "Facebook", handle: "@scoop.afrique", href: "https://facebook.com/scoop.afrique", followers: "359K", gradient: "from-blue-600 to-blue-400", description: "Communaute & actualites" },
  { name: "Threads", handle: "@Scoop.Afrique", href: "https://threads.net/@Scoop.Afrique", followers: "24.5K", gradient: "from-foreground to-muted-foreground", description: "Conversations & opinions" },
  { name: "Instagram", handle: "@Scoop.Afrique", href: "https://instagram.com/Scoop.Afrique", followers: "23.5K", gradient: "from-purple-600 via-pink-500 to-orange-400", description: "Stories & reels exclusifs" },
  { name: "YouTube", handle: "@Scoop.Afrique", href: "https://youtube.com/@Scoop.Afrique", followers: "6.5K", gradient: "from-red-600 to-red-400", description: "Reportages & analyses video" },
]

export function SocialCtaSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.2 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % socialPlatforms.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-background py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-br opacity-5 transition-all duration-1000 ${socialPlatforms[activeIndex].gradient}`} />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div className="mb-20 flex items-center gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">005</span>
          <div className="h-px flex-1 bg-border" />
          <GlitchText text="REJOIGNEZ-NOUS" className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-primary" />
        </div>
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-8 font-sans text-4xl font-black uppercase leading-none tracking-tight text-foreground md:text-5xl lg:text-6xl">
              En attendant le site,<br />suivez-nous.
            </h2>
            <p className="mb-12 max-w-md text-lg text-muted-foreground">
              Notre contenu est déjà disponible sur vos plateformes préférées. +1.25 million de personnes nous font déjà confiance.
            </p>
            <a
              href={socialPlatforms[activeIndex].href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden border-2 border-primary p-8 transition-all duration-500 hover:bg-primary"
              data-hover
            >
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-primary-foreground/70">Plateforme vedette</span>
                  <span className="font-mono text-2xl font-black text-primary transition-colors group-hover:text-primary-foreground">{socialPlatforms[activeIndex].followers}</span>
                </div>
                <h3 className="mb-2 font-sans text-3xl font-black uppercase text-foreground transition-colors group-hover:text-primary-foreground md:text-4xl">{socialPlatforms[activeIndex].name}</h3>
                <p className="text-muted-foreground transition-colors group-hover:text-primary-foreground/70">{socialPlatforms[activeIndex].description}</p>
              </div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-primary transition-all duration-300 group-hover:translate-x-2 group-hover:text-primary-foreground">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </a>
          </div>
          <div className="flex flex-col justify-center">
            {socialPlatforms.map((platform, index) => (
              <a
                key={platform.name}
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center justify-between border-b border-border py-6 transition-all duration-300 ${
                  isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                } ${activeIndex === index ? "border-primary" : ""}`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setActiveIndex(index)}
                data-hover
              >
                <div className="flex items-center gap-6">
                  <span className={`font-mono text-sm transition-colors ${activeIndex === index ? "text-primary" : "text-muted-foreground"}`}>
                    0{index + 1}
                  </span>
                  <div>
                    <h4 className={`font-sans text-xl font-bold uppercase tracking-wider transition-colors md:text-2xl ${activeIndex === index ? "text-primary" : "text-foreground"}`}>
                      {platform.name}
                    </h4>
                    <span className="font-mono text-xs text-muted-foreground">{platform.handle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-sans text-xl font-black text-primary md:text-2xl">{platform.followers}</span>
                  <div className={`h-6 w-6 transition-all duration-300 ${activeIndex === index ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`}>
                    <svg className="h-full w-full text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className="mt-24 border border-border bg-card p-8 md:p-12">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div>
              <span className="mb-2 block font-mono text-xs uppercase tracking-widest text-primary">Contact professionnel</span>
              <h3 className="font-sans text-2xl font-bold text-foreground md:text-3xl">Une question ? Un partenariat ?</h3>
              <p className="mt-2 text-muted-foreground">Notre équipe vous répond sous 48h.</p>
            </div>
            <FillHoverAnchor href="mailto:Contact@scoop-afrique.com" size="lg" className="px-8 py-4 font-mono tracking-widest">
              Contact@scoop-afrique.com
            </FillHoverAnchor>
          </div>
        </div>
      </div>
    </section>
  )
}
