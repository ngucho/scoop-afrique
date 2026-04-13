import Link from 'next/link'

type LegalPage = 'mentions' | 'confidentialite' | 'cgu'

const LINKS: { id: LegalPage; href: string; label: string }[] = [
  { id: 'mentions', href: '/mentions-legales', label: 'Mentions légales' },
  { id: 'confidentialite', href: '/politique-de-confidentialite', label: 'Politique de confidentialité' },
  { id: 'cgu', href: '/cgu', label: 'CGU' },
]

export function LegalNav({ current }: { current: LegalPage }) {
  return (
    <nav
      className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-8 text-sm text-muted-foreground"
      aria-label="Pages juridiques"
    >
      {LINKS.map((item) =>
        item.id === current ? (
          <span key={item.id} className="text-foreground/80">
            {item.label}
          </span>
        ) : (
          <Link key={item.id} href={item.href} className="text-primary hover:underline">
            {item.label}
          </Link>
        ),
      )}
    </nav>
  )
}
