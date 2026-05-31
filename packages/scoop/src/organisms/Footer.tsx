'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { Logo } from '../atoms/Logo'

export interface FooterLink {
  label: string
  href: string
}

export interface FooterSocialLink {
  label: string
  href: string
  /** SVG path data (24×24 viewBox) */
  iconPath?: string
}

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  logoWordmark?: string
  logoHref?: string
  tagline?: string
  links?: FooterLink[]
  legalLinks?: FooterLink[]
  socialLinks?: FooterSocialLink[]
  newsletterTitle?: string
  newsletterCta?: string
  copyright?: string
}

/* Icônes sociales SVG inline (24×24) */
const SOCIAL_ICONS: Record<string, string> = {
  tiktok:
    'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.86a8.16 8.16 0 0 0 4.77 1.52V6.93a4.85 4.85 0 0 1-1-.24z',
  instagram:
    'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
  facebook:
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  youtube:
    'M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z',
  threads:
    'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068V12c.001-3.552.875-6.44 2.567-8.506C5.869 1.134 8.658 0 12.162 0h.012c2.515.008 4.721.688 6.557 2.02 1.786 1.293 3.008 3.103 3.63 5.375l-2.757.737c-.995-3.731-3.66-5.678-7.43-5.678h-.012c-2.732 0-4.89.857-6.413 2.547-1.474 1.635-2.21 3.932-2.209 6.843v.068c0 2.894.722 5.164 2.147 6.747 1.466 1.629 3.666 2.459 6.536 2.468 2.413-.01 4.243-.682 5.592-2.054.68-.687 1.185-1.57 1.499-2.62-.67.21-1.349.332-2.032.372-1.394.08-2.767-.23-3.9-.928-1.2-.73-2.037-1.816-2.38-3.063-.36-1.313-.13-2.619.635-3.674.69-.963 1.756-1.626 3.065-1.918.556-.124 1.177-.185 1.904-.185.458 0 .912.025 1.36.075-.16-.638-.436-1.16-.824-1.556-.638-.66-1.577-.996-2.794-1.005h-.025c-.865 0-1.865.207-2.734 1.003l-1.762-1.813C11.04 3.3 12.534 2.857 14.2 2.85h.042c2.03.014 3.704.697 4.843 1.963.97 1.075 1.525 2.557 1.65 4.41.03.427.044.87.044 1.32v.3c0 .467-.015.924-.046 1.367-.037.535-.108 1.048-.212 1.534-.56 2.67-1.96 4.637-4.162 5.85-1.36.747-2.945 1.134-4.57 1.144z',
}

function SocialIcon({ iconPath }: { iconPath: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d={iconPath} />
    </svg>
  )
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  (
    {
      className,
      logoWordmark,
      logoHref = '/',
      tagline,
      links = [],
      legalLinks = [],
      socialLinks = [],
      newsletterTitle,
      newsletterCta,
      copyright,
      ...props
    },
    ref
  ) => (
    <footer
      ref={ref}
      className={cn('border-t border-border bg-card', className)}
      {...props}
    >
      {/* Bande éditoriale supérieure */}
      <div className="border-b border-border bg-muted/40 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-[var(--content-max-width)] flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <Logo href={logoHref} wordmark={logoWordmark ?? 'Scoop'} />
          {tagline ? (
            <p className="max-w-sm font-sans text-sm text-muted-foreground">{tagline}</p>
          ) : null}
          {socialLinks.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              {socialLinks.map((s) => {
                const key = s.label.toLowerCase()
                const path = s.iconPath ?? SOCIAL_ICONS[key]
                return (
                  <a
                    key={s.href}
                    href={s.href}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                  >
                    {path ? <SocialIcon iconPath={path} /> : (
                      <span className="text-[10px] font-bold uppercase">{s.label[0]}</span>
                    )}
                  </a>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Corps principal */}
      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Colonne liens */}
          {links.length > 0 ? (
            <div>
              <h3 className="mb-4 font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">
                Navigation
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="font-sans text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Colonne légal */}
          {legalLinks.length > 0 ? (
            <div>
              <h3 className="mb-4 font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">
                Légal
              </h3>
              <ul className="flex flex-col gap-2.5">
                {legalLinks.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="font-sans text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Newsletter */}
          {newsletterTitle ? (
            <div className="sm:col-span-2 lg:col-span-2">
              <h3 className="mb-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">
                {newsletterTitle}
              </h3>
              <p className="mb-4 font-sans text-sm text-muted-foreground">
                {newsletterCta ?? 'Recevez nos meilleurs articles chaque semaine.'}
              </p>
              <form
                className="flex max-w-sm gap-2"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="h-10 flex-1 min-w-0 rounded-full border border-input bg-background px-4 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Adresse e-mail"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-full bg-primary px-5 font-sans text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity duration-150 hover:opacity-90 active:scale-[0.97]"
                >
                  OK
                </button>
              </form>
            </div>
          ) : null}
        </div>

        {copyright ? (
          <p className="mt-12 border-t border-border pt-8 text-center font-sans text-xs text-muted-foreground">
            {copyright}
          </p>
        ) : null}
      </div>
    </footer>
  )
)
Footer.displayName = 'Footer'

export { Footer }
