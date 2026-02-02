"use client";

import { useEffect, useRef, useState } from "react";
import { GlitchText } from "./glitch-text";

const manifesteLines = [
  { text: "Nous sommes nés", highlight: false },
  { text: "de la frustration.", highlight: true },
  { text: "Frustrés par des médias", highlight: false },
  { text: "déconnectés de notre réalité.", highlight: false },
  { text: "Nous avons décidé", highlight: false },
  { text: "de créer le nôtre.", highlight: true },
];

const values = [
  {
    number: "01",
    title: "Authenticité",
    description: "Une information vraie, vérifiée, sans filtre ni compromis.",
  },
  {
    number: "02",
    title: "Accessibilité",
    description: "Un contenu pensé pour tous, partout, sur tous les écrans.",
  },
  {
    number: "03",
    title: "Innovation",
    description: "Les codes du digital au service de l'information africaine.",
  },
];

export function ManifesteSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [activeValue, setActiveValue] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const lineIndex = Number(entry.target.getAttribute("data-line"));
            setVisibleLines((prev) =>
              prev.includes(lineIndex) ? prev : [...prev, lineIndex]
            );
          }
        });
      },
      { threshold: 0.5, rootMargin: "-10% 0px" }
    );

    const lines = sectionRef.current?.querySelectorAll("[data-line]");
    lines?.forEach((line) => observer.observe(line));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveValue((prev) => (prev + 1) % values.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="manifeste"
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-background py-24 md:py-32"
    >
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        {/* Section header */}
        <div className="mb-20 flex items-center gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            001
          </span>
          <div className="h-px flex-1 bg-border" />
          <GlitchText
            text="MANIFESTE"
            className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-primary"
          />
        </div>

        {/* Main manifeste text */}
        <div className="mb-32 grid gap-16 lg:grid-cols-2">
          <div className="space-y-2">
            {manifesteLines.map((line, index) => (
              <div
                key={index}
                data-line={index}
                className={`overflow-hidden transition-all duration-700 ${
                  visibleLines.includes(index)
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <p
                  className={`font-sans text-3xl font-bold leading-tight md:text-5xl lg:text-6xl ${
                    line.highlight ? "text-primary" : "text-foreground"
                  }`}
                >
                  {line.text}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-end">
            <blockquote className="border-l-2 border-primary pl-6">
              <p className="mb-4 font-sans text-lg text-muted-foreground md:text-xl">
                &ldquo;Scoop Afrique, c{"'"}est la voix d{"'"}une génération qui refuse
                le silence. Nous informons, nous analysons, nous inspirons.&rdquo;
              </p>
              <footer className="font-mono text-sm text-primary">
                — L{"'"}équipe Scoop Afrique
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Values section */}
        <div className="grid gap-8 md:grid-cols-3">
          {values.map((value, index) => (
            <div
              key={value.number}
              className={`group relative cursor-pointer border-t-2 pt-8 transition-all duration-500 ${
                activeValue === index
                  ? "border-primary"
                  : "border-border hover:border-muted-foreground"
              }`}
              onMouseEnter={() => setActiveValue(index)}
            >
              {/* Progress bar */}
              {activeValue === index && (
                <div
                  className="absolute left-0 top-[-2px] h-[2px] bg-accent animate-[progress_4s_linear_forwards]"
                />
              )}

              <span
                className={`mb-4 block font-mono text-6xl font-black transition-colors duration-300 ${
                  activeValue === index
                    ? "text-primary"
                    : "text-muted/30 group-hover:text-muted-foreground"
                }`}
              >
                {value.number}
              </span>
              <h3 className="mb-2 font-sans text-xl font-bold uppercase tracking-wider text-foreground">
                {value.title}
              </h3>
              <p className="font-sans text-sm text-muted-foreground">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
