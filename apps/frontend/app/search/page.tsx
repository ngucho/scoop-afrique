import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { SearchForm } from './SearchForm'
import { config } from '@/lib/config'

const SITE_URL = config.siteUrl.replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Recherche - Scoop Afrique',
  description: 'Trouvez rapidement un article, une rubrique ou un sujet sur Scoop Afrique.',
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    title: 'Recherche | Scoop Afrique',
    description: 'Cherchez dans les articles et reprenez votre lecture.',
    url: `${SITE_URL}/search`,
    siteName: 'Scoop Afrique',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: { card: 'summary_large_image', title: 'Recherche | Scoop Afrique' },
  robots: { index: true, follow: true },
}

const prompts = ['Kinshasa', 'CAN', 'culture urbaine', 'CEDEAO', 'diaspora', 'startup', 'Abidjan']

export default function SearchPage() {
  return (
    <ReaderLayout>
      <main className="min-h-[70vh] bg-background text-foreground">
        <section className="mx-auto flex max-w-5xl flex-col px-5 py-12 sm:px-8 lg:px-10 lg:py-20">
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            Recherche
          </p>
          <h1
            className="mt-4 max-w-4xl text-6xl font-black leading-[0.88] sm:text-8xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Trouve le bon sujet. Lis le suivant.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
            Tape un pays, une ville, un nom ou une idee. On t&apos;envoie directement vers les articles qui matchent.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-border bg-card p-4 shadow-[var(--shadow-xl)] sm:p-5">
            <SearchForm variant="hero" />
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <Link
                key={prompt}
                href={`/articles?q=${encodeURIComponent(prompt)}`}
                className="rounded-full border border-border bg-card px-4 py-2 font-sans text-xs font-black uppercase tracking-[0.08em] text-muted-foreground hover:border-primary hover:text-primary"
              >
                {prompt}
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/articles"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-background"
            >
              Tous les articles <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full bg-card px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-foreground"
            >
              Retour au fil
            </Link>
          </div>
        </section>
      </main>
    </ReaderLayout>
  )
}
