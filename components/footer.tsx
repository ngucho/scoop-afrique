"use client";

import Link from "next/link";
import { GlitchText } from "./glitch-text";

const socialLinks = [
  { label: "TikTok", href: "https://tiktok.com/@Scoop.Afrique" },
  { label: "Facebook", href: "https://facebook.com/scoop.afrique" },
  { label: "Threads", href: "https://threads.net/@Scoop.Afrique" },
  { label: "Instagram", href: "https://instagram.com/Scoop.Afrique" },
  { label: "YouTube", href: "https://youtube.com/@Scoop.Afrique" },
];

const pageLinks = [
  { label: "A Propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
  { label: "Politique de Confidentialite", href: "/politique-de-confidentialite" },
  { label: "Mentions Legales", href: "/mentions-legales" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
      {/* Large background text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="whitespace-nowrap text-[20vw] font-black uppercase leading-none tracking-tighter text-muted/5">
          <span className="font-brasika">SCOOP</span>
          <span className="inline-block h-[0.28em] w-[0.28em] shrink-0 rounded-full bg-primary align-middle" />
          <span className="font-sans">AFRIQUE</span>
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24 lg:px-20">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            {/* 
              ===============================================
              REMPLACEZ CE BLOC PAR VOTRE LOGO SVG
              ===============================================
            */}
            <div className="mb-4">
              <div className="flex items-center gap-1">
                <GlitchText
                  text="SCOOP"
                  as="h3"
                  className="font-brasika text-3xl font-black uppercase leading-none tracking-tight text-foreground"
                  scramble={false}
                />
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full bg-primary align-middle"
                  aria-hidden
                />
                <GlitchText
                  text="AFRIQUE"
                  as="h3"
                  className="font-sans text-3xl font-black uppercase leading-none tracking-tight text-primary"
                  scramble={false}
                />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Le media digital qui decrypte
              <br />
              l{"'"}Afrique autrement.
            </p>
            <p className="mt-4 border-l-2 border-primary pl-3 text-xs italic text-muted-foreground">
              Attention aux imitations. Le vrai Scoop.Afrique
              <br />
              c{"'"}est nous — avec le point.
            </p>
          </div>

          {/* Pages */}
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Navigation
            </h4>
            <ul className="space-y-2">
              {pageLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
                    data-hover
                  >
                    <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-4" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Suivez-nous
            </h4>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
                    data-hover
                  >
                    <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-4" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Contact
            </h4>
            <div className="space-y-2 text-sm">
              <a
                href="mailto:Contact@scoop-afrique.com"
                className="block font-medium text-primary transition-colors hover:text-foreground"
                data-hover
              >
                Contact@scoop-afrique.com
              </a>
              <p className="pt-2 text-muted-foreground">
                Abidjan, Cote d{"'"}Ivoire
              </p>
            </div>
            
            {/* Experience badge */}
            <div className="mt-6 inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-3 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                Experience immersive
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {new Date().getFullYear()} Scoop.Afrique — Tous droits reserves
          </p>
          <div className="flex items-center gap-6">
            <Link 
              href="/politique-de-confidentialite" 
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
            >
              Confidentialite
            </Link>
            <Link 
              href="/mentions-legales" 
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
            >
              Mentions Legales
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Site en construction
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
