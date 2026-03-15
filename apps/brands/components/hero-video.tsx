'use client'

import { useEffect, useRef, useState } from 'react'
import {
  GlitchText,
  AfricanPattern,
  ThemeToggle,
  Dot,
  Separator,
  FillHoverAnchor,
} from 'scoop'

interface HeroVideoProps {
  videoSrc?: string
  posterImage?: string
  fallbackImage?: string
}

const socialLinks = [
  { name: 'TikTok', handle: '@Scoop.Afrique', href: 'https://tiktok.com/@Scoop.Afrique', followers: '837.5K' },
  { name: 'Facebook', handle: '@scoop.afrique', href: 'https://www.facebook.com/profile.php?id=61568464568442', followers: '359K' },
  { name: 'Threads', handle: '@Scoop.Afrique', href: 'https://threads.net/@Scoop.Afrique', followers: '24.5K' },
  { name: 'Instagram', handle: '@Scoop.Afrique', href: 'https://instagram.com/Scoop.Afrique', followers: '23.5K' },
  { name: 'YouTube', handle: '@Scoop.Afrique', href: 'https://youtube.com/@Scoop.Afrique', followers: '6.5K' },
]

export function HeroVideo({ videoSrc, posterImage, fallbackImage }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLElement>(null)
  const [scrollY, setScrollY] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        })
      }
    }
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouseMove)
    const timeInterval = setInterval(() => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Africa/Abidjan',
        })
      )
    }, 1000)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(timeInterval)
    }
  }, [])

  const parallaxY = scrollY * 0.5
  const opacity = Math.max(0, 1 - scrollY / 600)

  return (
    <section
      ref={containerRef}
      className="relative flex h-screen min-h-[100dvh] w-full items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${parallaxY}px)` }}>
        {videoSrc ? (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            poster={posterImage}
            className="h-full w-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: fallbackImage
                ? `url(${fallbackImage})`
                : 'linear-gradient(135deg, var(--background) 0%, var(--secondary) 50%, var(--background) 100%)',
            }}
          />
        )}
        <div className="noise-overlay absolute inset-0 animate-noise" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/20 to-background" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="h-1 w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            style={{ animation: 'scanline 4s linear infinite' }}
          />
        </div>
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 text-primary opacity-20"
        style={{
          transform: `translate(calc(-50% + ${mousePosition.x * 30}px), calc(-50% + ${mousePosition.y * 30}px))`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <AfricanPattern className="h-full w-full scoop-float" />
      </div>

      <div
        className="relative z-10 flex h-full w-full flex-col px-6 py-6 md:px-12 lg:px-20 lg:py-8"
        style={{ opacity }}
      >
        <header className="flex shrink-0 items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Abidjan, Cote d&apos;Ivoire
            </span>
            <span className="font-mono text-2xl font-bold tabular-nums text-primary">
              {currentTime || '00:00:00'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <nav className="hidden flex-col items-end gap-2 md:flex">
              {socialLinks.map((link, index) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-right transition-all duration-300 hover:-translate-x-2"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  data-hover
                >
                  <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-primary">
                    {link.followers}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wider text-foreground transition-colors group-hover:text-primary">
                    {link.name}
                  </span>
                  <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-8" />
                </a>
              ))}
            </nav>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto overflow-x-hidden py-4 text-center sm:gap-6">
          <div className="relative">
            <div className="logo-placeholder mb-4 flex flex-col items-center justify-center p-8">
              <div className="flex flex-col items-center">
                <GlitchText
                  text="SCOOP."
                  as="h1"
                  className="font-brasika text-[15vw] font-black uppercase leading-none tracking-tight text-foreground md:text-[10vw]"
                  delay={200}
                />
                <div className="flex items-center gap-2">
                  <Dot size="lg" className="rounded-full" />
                  <GlitchText
                    text="Afrique"
                    as="h1"
                    className="font-sans text-[15vw] font-black uppercase leading-none tracking-tight text-primary md:text-[10vw]"
                    delay={400}
                  />
                </div>
              </div>
              <span className="mt-4 font-mono text-[10px] text-muted-foreground/50">
                Sur la Pop, On mise tout!
              </span>
            </div>
          </div>

          <p className="max-w-xl font-sans text-lg text-muted-foreground md:text-xl">
            Le media digital qui decrypte l&apos;Afrique autrement.
          </p>

          <div className="mt-2 flex flex-shrink-0 items-center justify-center gap-4 sm:mt-4">
            <FillHoverAnchor href="#manifeste" size="default">
              Decouvrir
            </FillHoverAnchor>
            <Separator orientation="vertical" className="h-8" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Arrive bientot
            </span>
          </div>
        </div>

        <footer className="mt-auto flex shrink-0 flex-wrap items-end justify-between gap-4 pt-4">
          <div className="flex gap-8">
            {[
              { value: '1.25M+', label: 'Abonnes' },
              { value: '490M+', label: 'Vues' },
              { value: '12+', label: 'Pays' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="font-sans text-3xl font-black text-primary md:text-4xl">
                  {stat.value}
                </span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Scroll
            </span>
            <div className="relative h-12 w-px overflow-hidden bg-border">
              <div className="absolute h-4 w-full animate-bounce bg-primary" />
            </div>
          </div>
        </footer>
      </div>

      <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center gap-4 md:hidden">
        {socialLinks.slice(0, 4).map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-12 items-center justify-center border border-border bg-background/50 text-foreground backdrop-blur-sm transition-all hover:border-primary hover:text-primary"
            data-hover
          >
            <span className="text-xs font-bold">{link.name[0]}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
