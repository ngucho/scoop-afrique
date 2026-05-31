'use client'

import { useState } from 'react'
import { MotionEnter } from 'scoop'

export function HomeNewsletterCta() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
  }

  return (
    <MotionEnter as="section" className="my-12 w-full min-w-0 max-w-full md:my-14">
      <div className="relative overflow-hidden rounded-2xl border-l-[6px] border-l-primary bg-muted/50 p-6 sm:p-8 md:p-10">
        {/* Motif décoratif de fond */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, var(--primary) 0, var(--primary) 1px, transparent 0, transparent 50%), repeating-linear-gradient(-45deg, var(--primary) 0, var(--primary) 1px, transparent 0, transparent 50%)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden
        />

        <div className="relative z-10 flex min-w-0 max-w-full flex-col gap-5 md:flex-row md:items-center md:gap-10">
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
              Newsletter Scoop Afrique
            </p>
            <h2
              className="text-xl font-bold leading-tight text-foreground sm:text-2xl"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              L&apos;Afrique cette semaine,{' '}
              <span className="text-primary">en 5 minutes</span>
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Les analyses, reportages et décryptages sélectionnés par notre rédaction — chaque semaine dans votre boîte.
            </p>
          </div>

          {submitted ? (
            <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-center">
              <p className="font-sans text-sm font-semibold text-primary">✓ Inscription confirmée !</p>
              <p className="mt-1 font-sans text-xs text-muted-foreground">
                Vérifiez vos e-mails pour confirmer.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-center"
            >
              <label htmlFor="newsletter-email-home" className="sr-only">
                Votre adresse e-mail
              </label>
              <input
                id="newsletter-email-home"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="h-10 min-w-0 rounded-full border border-input bg-background px-4 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-52"
                aria-label="Adresse e-mail pour la newsletter"
              />
              <button
                type="submit"
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-primary px-5 font-sans text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity duration-150 hover:opacity-90 active:scale-[0.97]"
              >
                S&apos;abonner
              </button>
            </form>
          )}
        </div>
      </div>
    </MotionEnter>
  )
}
