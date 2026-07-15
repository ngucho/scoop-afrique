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
    <MotionEnter as="section" className="my-8 w-full min-w-0 max-w-full md:my-10">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-background/10 bg-foreground p-5 text-background sm:p-6 md:p-7">
        <div className="relative z-10 flex min-w-0 max-w-full flex-col gap-5 md:flex-row md:items-center md:gap-8">
          <div className="min-w-0 flex-1">
            <p className="mb-2 font-sans text-[10px] font-black uppercase tracking-[0.22em] text-primary">
              Drop hebdo
            </p>
            <h2
              className="text-2xl font-black leading-tight text-background"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Une courte selection. Rien de plus.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-background/64">
              Le meilleur a lire quand tu reviens, sans te noyer dans le flux.
            </p>
          </div>

          {submitted ? (
            <div className="shrink-0 rounded-full border border-background/15 bg-card px-5 py-3 text-center">
              <p className="font-sans text-sm font-black text-primary">Inscription confirmee</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex min-w-0 shrink-0 flex-col gap-3 sm:flex-row sm:items-center"
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
                className="h-11 min-w-0 rounded-full border border-background/15 bg-card px-4 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:w-64"
                aria-label="Adresse e-mail pour la newsletter"
              />
              <button
                type="submit"
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-secondary px-6 font-sans text-xs font-black uppercase tracking-[0.12em] text-foreground transition-colors duration-150 hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
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
