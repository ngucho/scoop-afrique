import Link from 'next/link'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { Heading, Button, Dot, GlitchText } from 'scoop'

export default function NotFound() {
  return (
    <ReaderLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GlitchText text="SCOOP" as="span" scramble={false} className="font-[var(--font-scoop)] text-2xl font-black uppercase text-foreground" />
          <Dot size="lg" className="shrink-0" />
          <GlitchText text="AFRIQUE" as="span" scramble={false} className="font-sans text-2xl font-black uppercase text-primary" />
        </div>
        <Heading as="h1" level="h1" className="mt-12 text-6xl font-bold tabular-nums text-foreground sm:text-8xl">
          404
        </Heading>
        <p className="mt-4 max-w-sm text-center text-muted-foreground">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild>
            <Link href="/">Accueil</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/articles">Voir les articles</Link>
          </Button>
        </div>
      </div>
    </ReaderLayout>
  )
}
