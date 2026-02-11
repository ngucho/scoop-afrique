'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { Logo } from '../atoms/Logo'

export interface FooterLink {
  label: string
  href: string
}

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  logoWordmark?: string
  logoHref?: string
  links?: FooterLink[]
  legalLinks?: FooterLink[]
  socialLinks?: { label: string; href: string }[]
  newsletterTitle?: string
  newsletterCta?: string
  copyright?: string
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  (
    {
      className,
      logoWordmark,
      logoHref = '/',
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
      className={cn(
        'border-t border-border bg-muted/30 py-12',
        className
      )}
      {...props}
    >
      <div className="mx-auto max-w-[var(--content-max-width)] px-4">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Logo href={logoHref} wordmark={logoWordmark ?? 'Scoop'} />
            {socialLinks.length > 0 ? (
              <div className="flex gap-4">
                {socialLinks.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          {links.length > 0 ? (
            <div>
              <h3 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-foreground">
                Liens
              </h3>
              <ul className="flex flex-col gap-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {legalLinks.length > 0 ? (
            <div>
              <h3 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-foreground">
                Légal
              </h3>
              <ul className="flex flex-col gap-2">
                {legalLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {newsletterTitle ? (
            <div>
              <h3 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-foreground">
                {newsletterTitle}
              </h3>
              <p className="mb-3 text-sm text-muted-foreground">
                {newsletterCta ?? 'Inscrivez-vous à notre newsletter.'}
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Email"
                  className="h-10 flex-1 border border-input bg-background px-3 py-2 text-sm"
                  aria-label="Email"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center border-2 border-primary bg-primary px-4 font-sans text-sm font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90"
                >
                  OK
                </button>
              </form>
            </div>
          ) : null}
        </div>
        {copyright ? (
          <p className="mt-8 border-t border-border pt-8 text-center text-xs text-muted-foreground">
            {copyright}
          </p>
        ) : null}
      </div>
    </footer>
  )
)
Footer.displayName = 'Footer'

export { Footer }
