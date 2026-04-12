import Link from 'next/link'
import { Button } from 'scoop'
import { MotionEnter } from 'scoop'

export function HomeNewsletterCta() {
  return (
    <MotionEnter as="section" className="my-14 w-full min-w-0 max-w-full">
      <div className="flex min-w-0 max-w-full flex-col gap-6 rounded-2xl border-l-8 border-primary bg-editorial-surface-high p-5 sm:gap-8 sm:p-8 md:flex-row md:items-center md:p-10">
        <div className="min-w-0 flex-1">
          <h2
            className="text-2xl font-bold leading-tight text-editorial-on-surface sm:text-3xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Restez informé
          </h2>
          <p className="mt-2 max-w-xl text-editorial-secondary">
            Recevez chaque semaine l&apos;essentiel de l&apos;actualité africaine sélectionnée par nos rédacteurs.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0 rounded-full">
          <Link href="/newsletter">S&apos;abonner à la newsletter</Link>
        </Button>
      </div>
    </MotionEnter>
  )
}
