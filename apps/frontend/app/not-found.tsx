import Link from 'next/link'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { Button, Dot, GlitchText } from 'scoop'

export default function NotFound() {
  return (
    <ReaderLayout>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-1">
          <GlitchText
            text="SCOOP"
            as="span"
            scramble={false}
            className="font-[var(--font-scoop)] text-xl font-black uppercase text-foreground"
          />
          <Dot size="md" className="shrink-0" />
          <GlitchText
            text="AFRIQUE"
            as="span"
            scramble={false}
            className="font-sans text-xl font-black uppercase text-primary"
          />
        </div>

        {/* 404 */}
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
          Erreur 404
        </p>
        <h1
          className="mb-4 text-6xl font-bold tracking-tight text-foreground sm:text-8xl md:text-9xl"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Oops.
        </h1>
        <p className="mb-2 font-sans text-lg font-semibold text-foreground">
          Cette page a disparu dans les archives.
        </p>
        <p className="mb-10 max-w-sm font-sans text-sm leading-relaxed text-muted-foreground">
          Le lien est peut-être cassé ou la page a été déplacée. L&apos;actualité africaine, elle, continue sur l&apos;accueil.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/articles">Voir les articles</Link>
          </Button>
        </div>
      </div>
    </ReaderLayout>
  )
}
