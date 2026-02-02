"use client";

import { useEffect, useRef, useState } from "react";
import { GlitchText } from "./glitch-text";
import { Play, Heart, MessageCircle, Share2, Eye } from "lucide-react";

// Placeholder publications - Replace with real content
const publications = {
  tiktok: [
    {
      id: 1,
      thumbnail: "/publications/tiktok-1.jpg",
      views: "2.5M",
      likes: "156K",
      title: "La reaction de ce joueur...",
    },
    {
      id: 2,
      thumbnail: "/publications/tiktok-2.jpg",
      views: "1.8M",
      likes: "98K",
      title: "Quand le president dit...",
    },
    {
      id: 3,
      thumbnail: "/publications/tiktok-3.jpg",
      views: "3.2M",
      likes: "245K",
      title: "Cette scene incroyable...",
    },
  ],
  instagram: [
    {
      id: 1,
      thumbnail: "/publications/instagram-1.jpg",
      likes: "45K",
      comments: "1.2K",
    },
    {
      id: 2,
      thumbnail: "/publications/instagram-2.jpg",
      likes: "38K",
      comments: "890",
    },
    {
      id: 3,
      thumbnail: "/publications/instagram-3.jpg",
      likes: "52K",
      comments: "1.5K",
    },
  ],
  facebook: [
    {
      id: 1,
      thumbnail: "/publications/facebook-1.jpg",
      reactions: "12K",
      shares: "3.2K",
    },
    {
      id: 2,
      thumbnail: "/publications/facebook-2.jpg",
      reactions: "8.5K",
      shares: "2.1K",
    },
  ],
  youtube: {
    videoId: "YOUR_VIDEO_ID", // Replace with actual YouTube video ID
    title: "Notre derniere video",
    views: "125K",
    duration: "12:34",
  },
};

type Platform = "tiktok" | "instagram" | "facebook";

export function PublicationsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform>("tiktok");
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const platforms: { key: Platform; label: string; color: string }[] = [
    { key: "tiktok", label: "TikTok", color: "from-cyan-400 to-pink-500" },
    { key: "instagram", label: "Instagram", color: "from-purple-500 to-orange-400" },
    { key: "facebook", label: "Facebook", color: "from-blue-600 to-blue-400" },
  ];

  return (
    <section
      ref={sectionRef}
      id="publications"
      className="relative overflow-hidden bg-secondary py-24 md:py-32"
    >
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_1px,_transparent_1px)] bg-[length:24px_24px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        {/* Section header */}
        <div className="mb-16 flex items-center gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            004
          </span>
          <div className="h-px flex-1 bg-border" />
          <GlitchText
            text="NOS PUBLICATIONS"
            className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-primary"
          />
        </div>

        {/* Main heading */}
        <div className="mb-16 max-w-3xl">
          <h2 className="mb-6 font-sans text-4xl font-black uppercase leading-none tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Decouvrez notre
            <br />
            <span className="text-primary">contenu viral</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Un apercu de ce qui fait vibrer notre communaute chaque jour.
            Des millions de vues, des millions de reactions.
          </p>
        </div>

        {/* Platform tabs */}
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

        {/* Publications grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activePlatform === "tiktok" &&
            publications.tiktok.map((item, index) => (
              <div
                key={item.id}
                className={`group relative aspect-[9/16] cursor-pointer overflow-hidden border border-border bg-card transition-all duration-500 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                data-hover
              >
                {/* Placeholder background */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-pink-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-xs text-muted-foreground">
                    [TikTok {item.id}]
                  </span>
                </div>

                {/* Play button */}
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-background/50 transition-opacity duration-300 ${
                    hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="flex h-16 w-16 items-center justify-center border-2 border-primary bg-primary/20 backdrop-blur-sm">
                    <Play className="h-6 w-6 fill-primary text-primary" />
                  </div>
                </div>

                {/* Stats overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-4">
                  <p className="mb-2 line-clamp-2 text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {item.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {item.likes}
                    </span>
                  </div>
                </div>
              </div>
            ))}

          {activePlatform === "instagram" &&
            publications.instagram.map((item, index) => (
              <div
                key={item.id}
                className={`group relative aspect-square cursor-pointer overflow-hidden border border-border bg-card transition-all duration-500 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                data-hover
              >
                {/* Placeholder background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-orange-400/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-xs text-muted-foreground">
                    [Instagram {item.id}]
                  </span>
                </div>

                {/* Hover overlay */}
                <div
                  className={`absolute inset-0 flex items-center justify-center gap-6 bg-background/70 transition-opacity duration-300 ${
                    hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Heart className="h-5 w-5 fill-primary text-primary" />
                    {item.likes}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    {item.comments}
                  </span>
                </div>
              </div>
            ))}

          {activePlatform === "facebook" &&
            publications.facebook.map((item, index) => (
              <div
                key={item.id}
                className={`group relative aspect-video cursor-pointer overflow-hidden border border-border bg-card transition-all duration-500 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                data-hover
              >
                {/* Placeholder background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-400/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-xs text-muted-foreground">
                    [Facebook {item.id}]
                  </span>
                </div>

                {/* Hover overlay */}
                <div
                  className={`absolute inset-0 flex items-center justify-center gap-6 bg-background/70 transition-opacity duration-300 ${
                    hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Heart className="h-5 w-5 fill-primary text-primary" />
                    {item.reactions}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Share2 className="h-5 w-5 text-primary" />
                    {item.shares}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* YouTube Featured Video */}
        <div className="mt-16 border border-border bg-card p-6 md:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center bg-[#FF0000]">
              <Play className="h-5 w-5 fill-white text-white" />
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                YouTube
              </span>
              <h3 className="font-sans text-xl font-bold text-foreground">
                Notre chaine
              </h3>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Video embed placeholder */}
            <div className="relative aspect-video overflow-hidden bg-secondary">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center border-2 border-primary bg-primary/20">
                  <Play className="h-8 w-8 fill-primary text-primary" />
                </div>
                <span className="font-mono text-sm text-muted-foreground">
                  [Video YouTube]
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  Remplacez YOUR_VIDEO_ID dans le code
                </span>
              </div>
            </div>

            {/* Video info */}
            <div className="flex flex-col justify-center">
              <span className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">
                Derniere video
              </span>
              <h4 className="mb-4 font-sans text-2xl font-bold text-foreground md:text-3xl">
                {publications.youtube.title}
              </h4>
              <div className="mb-6 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {publications.youtube.views} vues
                </span>
                <span>{publications.youtube.duration}</span>
              </div>
              <a
                href="https://youtube.com/@Scoop.Afrique"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex w-fit items-center gap-2 overflow-hidden border-2 border-primary bg-transparent px-6 py-3 font-mono text-sm uppercase tracking-wider text-primary transition-all duration-300 hover:text-primary-foreground"
                data-hover
              >
                <span className="relative z-10">Voir la chaine</span>
                <span className="absolute inset-0 -translate-x-full bg-primary transition-transform duration-300 group-hover:translate-x-0" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
