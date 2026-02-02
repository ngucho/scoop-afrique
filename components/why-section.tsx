"use client";

import { useEffect, useRef, useState } from "react";
import { GlitchText } from "./glitch-text";
import { MarqueeBand } from "./marquee-band";

const features = [
  {
    number: "01",
    title: "INFORMATION VÉRIFIÉE",
    description: "Chaque information est sourcée, vérifiée et contextualisée avant publication.",
    stat: "100%",
    statLabel: "Fact-checked",
  },
  {
    number: "02",
    title: "DONNÉES EXCLUSIVES",
    description: "Des analyses approfondies avec des chiffres et statistiques inédites sur l'Afrique.",
    stat: "490M+",
    statLabel: "Vues totales",
  },
  {
    number: "03",
    title: "FORMAT NATIF",
    description: "Contenu optimisé pour chaque plateforme : TikTok, Instagram, YouTube, Threads.",
    stat: "5",
    statLabel: "Plateformes",
  },
  {
    number: "04",
    title: "VOIX AFRICAINE",
    description: "Une perspective authentique, par des Africains, pour les Africains et le monde.",
    stat: "12+",
    statLabel: "Pays touchés",
  },
];

const services = [
  "Couverture Médiatique",
  "Promotion Artiste",
  "Promotion Concert",
  "Reportage Pro",
  "Publication Pub",
  "Partenariat",
];

export function WhySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-card">
      {/* Marquee Band */}
      <MarqueeBand
        text="INFORMER — ANALYSER — INSPIRER — CONNECTER"
        direction="left"
        speed={25}
      />

      <div className="relative py-24 md:py-32">
        {/* Floating elements based on mouse */}
        <div
          className="pointer-events-none absolute h-96 w-96 rounded-full bg-primary/5 blur-3xl"
          style={{
            left: mousePos.x - 192,
            top: mousePos.y - 400,
            transition: "all 0.5s ease-out",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
          {/* Section header */}
          <div className="mb-20 flex items-center gap-6">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              002
            </span>
            <div className="h-px flex-1 bg-border" />
            <GlitchText
              text="POURQUOI NOUS"
              className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-primary"
            />
          </div>

          {/* Title */}
          <div className="mb-20 max-w-4xl">
            <h2 className="font-sans text-4xl font-black uppercase leading-none tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Le média qui
              <br />
              <span className="text-primary">change les codes</span>
            </h2>
          </div>

          {/* Features Grid */}
          <div className="grid gap-px bg-border md:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={feature.number}
                className="group relative cursor-pointer bg-card p-8 transition-all duration-500 hover:bg-secondary md:p-12"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                data-hover
              >
                {/* Corner accent */}
                <div
                  className={`absolute right-0 top-0 h-16 w-16 border-b border-l transition-all duration-500 ${
                    hoveredFeature === index
                      ? "border-primary bg-primary/10"
                      : "border-border bg-transparent"
                  }`}
                />

                {/* Number */}
                <span
                  className={`mb-6 block font-mono text-7xl font-black transition-colors duration-300 md:text-8xl ${
                    hoveredFeature === index
                      ? "text-primary"
                      : "text-muted/20"
                  }`}
                >
                  {feature.number}
                </span>

                {/* Content */}
                <div className="flex items-end justify-between gap-8">
                  <div className="flex-1">
                    <h3
                      className={`mb-3 font-sans text-xl font-bold uppercase tracking-wider transition-colors duration-300 md:text-2xl ${
                        hoveredFeature === index
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {feature.title}
                    </h3>
                    <p className="font-sans text-sm text-muted-foreground md:text-base">
                      {feature.description}
                    </p>
                  </div>

                  {/* Stat */}
                  <div
                    className={`text-right transition-all duration-500 ${
                      hoveredFeature === index
                        ? "translate-y-0 opacity-100"
                        : "translate-y-4 opacity-0"
                    }`}
                  >
                    <span className="block font-sans text-3xl font-black text-accent md:text-4xl">
                      {feature.stat}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {feature.statLabel}
                    </span>
                  </div>
                </div>

                {/* Hover line */}
                <div
                  className={`absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500 ${
                    hoveredFeature === index ? "w-full" : "w-0"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Services */}
          <div className="mt-20">
            <h3 className="mb-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Nos Services
            </h3>
            <div className="flex flex-wrap gap-3">
              {services.map((service) => (
                <span
                  key={service}
                  className="border border-border px-6 py-3 font-sans text-sm font-medium uppercase tracking-wider text-foreground transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  data-hover
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom marquee */}
      <MarqueeBand
        text="ACTUALITÉ — POP CULTURE — SPORT — POLITIQUE — ÉCONOMIE — DIVERTISSEMENT"
        direction="right"
        speed={30}
      />
    </section>
  );
}
