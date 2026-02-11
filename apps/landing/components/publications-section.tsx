'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { SectionHeader, FillHoverAnchor } from 'scoop'
import { Play, Heart, MessageCircle, Share2, Eye } from 'lucide-react'

const TIKTOK_PROFILE = "https://www.tiktok.com/@Scoop.Afrique"
const INSTAGRAM_PROFILE = "https://www.instagram.com/Scoop.Afrique"
const FACEBOOK_PROFILE = "https://www.facebook.com/profile.php?id=61568464568442"

const publications = {
  tiktok: [
    { id: 1, thumbnail: "/publications/publication-tiktok1.png", views: "2.5M", likes: "156K", title: "La reaction de ce joueur...", url: TIKTOK_PROFILE + "/video/7575118278981340472" },
    { id: 2, thumbnail: "/publications/publication-tiktok2.png", views: "1.8M", likes: "98K", title: "Quand le president dit...", url: TIKTOK_PROFILE + "/video/7564090185709899020" },
    { id: 3, thumbnail: "/publications/publication-tiktok3.png", views: "3.2M", likes: "245K", title: "Cette scene incroyable...", url: TIKTOK_PROFILE + "/photo/7592945282971897099" },
  ],
  instagram: [
    { id: 1, thumbnail: "/publications/publication-insta1.png", likes: "45K", comments: "1.2K", url: INSTAGRAM_PROFILE + "/p/DUGjoX4jL2L/" },
    { id: 2, thumbnail: "/publications/publication-insta2.png", likes: "38K", comments: "890", url: INSTAGRAM_PROFILE + "/p/DT3wUuSDA3H/" },
    { id: 3, thumbnail: "/publications/publication-insta3.png", likes: "38K", comments: "890", url: INSTAGRAM_PROFILE + "/p/DT3KjHbDBUJ/" },
  ],
  facebook: [
    { id: 1, thumbnail: "/publications/publication-fb1.png", reactions: "12K", shares: "3.2K", url: "https://www.facebook.com/photo?fbid=122165253944615485&set=a.122116308248615485" },
    { id: 2, thumbnail: "/publications/publication-fb2.png", reactions: "8.5K", shares: "2.1K", url: "https://www.facebook.com/photo?fbid=122164579460615485&set=a.122116308248615485" },
  ],
  youtube: { videoId: "9wo4zKEEeb4", title: "Notre derniere video", views: "125K", duration: "12:34" },
}

type Platform = "tiktok" | "instagram" | "facebook"

export function PublicationsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activePlatform, setActivePlatform] = useState<Platform>("tiktok")
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const platforms: { key: Platform; label: string }[] = [
    { key: "tiktok", label: "TikTok" },
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
  ]

  return (
    <section
      ref={sectionRef}
      id="publications"
      className="relative overflow-hidden bg-secondary py-24 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_1px,_transparent_1px)] bg-[length:24px_24px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <SectionHeader number="004" label="NOS PUBLICATIONS" className="mb-16" />
        <div className="mb-16 max-w-3xl">
          <h2 className="mb-6 font-sans text-4xl font-black uppercase leading-none tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Découvrez notre
            <br />
            <span className="text-primary">contenu viral</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Un aperçu de ce qui fait vibrer notre communauté chaque jour.
          </p>
        </div>
        <div className="mb-12 flex flex-wrap gap-4">
          {platforms.map((platform) => (
            <button
              key={platform.key}
              onClick={() => setActivePlatform(platform.key)}
              className={`group relative overflow-hidden border-2 px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all duration-300 ${
                activePlatform === platform.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent text-foreground hover:border-primary"
              }`}
              data-hover
            >
              <span className="relative z-10">{platform.label}</span>
              {activePlatform !== platform.key && (
                <span className="absolute inset-0 -translate-x-full bg-primary transition-transform duration-300 group-hover:translate-x-0" />
              )}
            </button>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activePlatform === "tiktok" &&
            publications.tiktok.map((item, index) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative block aspect-[9/16] cursor-pointer overflow-hidden border border-border bg-card transition-all duration-500 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                data-hover
              >
                <div className="absolute inset-0">
                  <Image
                    src={item.thumbnail}
                    alt={`TikTok ${item.id}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-background/50 transition-opacity duration-300 ${
                    hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="flex h-16 w-16 items-center justify-center border-2 border-primary bg-primary/20 backdrop-blur-sm">
                    <Play className="h-6 w-6 fill-primary text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-4">
                  <p className="mb-2 line-clamp-2 text-sm font-medium text-foreground">{item.title}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.views}</span>
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{item.likes}</span>
                  </div>
                </div>
              </a>
            ))}
          {activePlatform === "instagram" &&
            publications.instagram.map((item, index) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative block aspect-square cursor-pointer overflow-hidden border border-border bg-card transition-all duration-500 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                data-hover
              >
                <div className="absolute inset-0">
                  <Image src={item.thumbnail} alt={`Instagram ${item.id}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                </div>
                <div
                  className={`absolute inset-0 flex items-center justify-center gap-6 bg-background/70 transition-opacity duration-300 ${
                    hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Heart className="h-5 w-5 fill-primary text-primary" />{item.likes}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <MessageCircle className="h-5 w-5 text-primary" />{item.comments}
                  </span>
                </div>
              </a>
            ))}
          {activePlatform === "facebook" &&
            publications.facebook.map((item, index) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative block aspect-video cursor-pointer overflow-hidden border border-border bg-card transition-all duration-500 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                data-hover
              >
                <div className="absolute inset-0">
                  <Image src={item.thumbnail} alt={`Facebook ${item.id}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                </div>
                <div
                  className={`absolute inset-0 flex items-center justify-center gap-6 bg-background/70 transition-opacity duration-300 ${
                    hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Heart className="h-5 w-5 fill-primary text-primary" />{item.reactions}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Share2 className="h-5 w-5 text-primary" />{item.shares}
                  </span>
                </div>
              </a>
            ))}
        </div>
        <div className="mt-16 border border-border bg-card p-6 md:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center bg-[#FF0000]">
              <Play className="h-5 w-5 fill-white text-white" />
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">YouTube</span>
              <h3 className="font-sans text-xl font-bold text-foreground">Notre chaine</h3>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="relative aspect-video overflow-hidden bg-secondary">
              <iframe
                src={`https://www.youtube.com/embed/${publications.youtube.videoId}?rel=0`}
                title={publications.youtube.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">Derniere video</span>
              <h4 className="mb-4 font-sans text-2xl font-bold text-foreground md:text-3xl">{publications.youtube.title}</h4>
              <div className="mb-6 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Eye className="h-4 w-4" />{publications.youtube.views} vues</span>
                <span>{publications.youtube.duration}</span>
              </div>
              <FillHoverAnchor
                href="https://youtube.com/@Scoop.Afrique"
                target="_blank"
                rel="noopener noreferrer"
                size="default"
                className="inline-flex w-fit"
              >
                Voir la chaîne
              </FillHoverAnchor>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
