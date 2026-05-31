import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { NewsletterForm } from './NewsletterForm'
import { Heading, SectionHeader } from 'scoop'

export const metadata = {
  title: 'Newsletter — Scoop Afrique',
  description:
    "Inscrivez-vous à la newsletter Scoop Afrique. L'essentiel de l'actualité africaine chaque semaine dans votre boîte mail.",
}

export default function NewsletterPage() {
  return (
    <ReaderLayout>
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10">
          <SectionHeader label="Newsletter" variant="editorial" className="mb-5" />
          <Heading
            as="h1"
            level="h1"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            L&apos;Afrique cette semaine,{' '}
            <span className="text-primary">en 5 minutes</span>
          </Heading>
          <p className="mt-3 font-sans text-base leading-relaxed text-muted-foreground">
            Les analyses, reportages et décryptages sélectionnés par notre rédaction — chaque semaine dans votre boîte.
            Gratuit. Sans spam. Désabonnement en un clic.
          </p>

          <ul className="mt-5 space-y-2">
            {[
              'Actualités africaines sélectionnées par la rédaction',
              'Reportages exclusifs et décryptages en profondeur',
              'Chaque semaine, un angle africain sur le monde',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 font-sans text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </header>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-md)] sm:p-8">
          <NewsletterForm />
        </div>

        <p className="mt-5 text-center font-sans text-xs text-muted-foreground">
          En vous inscrivant, vous acceptez notre{' '}
          <a href="/politique-de-confidentialite" className="underline underline-offset-2 hover:text-foreground">
            politique de confidentialité
          </a>
          .
        </p>
      </div>
    </ReaderLayout>
  )
}
