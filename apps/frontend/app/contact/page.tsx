import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail, MapPin, Clock, Send } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ContactLeadForm } from '@/components/ContactLeadForm'
import { Heading, SectionHeader } from 'scoop'

export const metadata: Metadata = {
  title: 'Contact — Scoop Afrique',
  description:
    "Contactez l'équipe Scoop Afrique. Partenariats, publicité, presse ou simplement pour nous dire bonjour.",
}

const contactInfo = [
  {
    icon: Mail,
    title: 'E-mail',
    value: 'Contact@scoop-afrique.com',
    href: 'mailto:Contact@scoop-afrique.com' as string | null,
  },
  {
    icon: MapPin,
    title: 'Siège',
    value: "Abidjan, Cocody Riviera Faya — Côte d'Ivoire",
    href: null,
  },
  {
    icon: Clock,
    title: 'Délai de réponse',
    value: 'Sous 24–48 h ouvrées',
    href: null,
  },
]

const departments = [
  {
    title: 'Partenariats & Publicité',
    description:
      'Collaborations commerciales, sponsorings, campagnes digitales et placements de produits sur nos plateformes.',
    email: 'Contact@scoop-afrique.com',
    subject: 'Partenariat / Publicité',
  },
  {
    title: 'Couverture & Vidéo',
    description:
      'Couverture événementielle, reportages terrain et contenus vidéo sur mesure. Devis sous 48 h.',
    email: 'Contact@scoop-afrique.com',
    subject: 'Couverture médiatique / Vidéo',
  },
  {
    title: 'Interviews & Podcast',
    description:
      'Interviews, promotion artiste, podcast et partenariat de marque. Nous répondons vite.',
    email: 'Scoopmagco@gmail.com',
    subject: 'Interview / Podcast',
  },
  {
    title: 'Rédaction & Presse',
    description:
      'Communiqués de presse, propositions d\'articles et informations à destination de notre rédaction.',
    email: 'Contact@scoop-afrique.com',
    subject: 'Presse',
  },
  {
    title: 'Support technique',
    description:
      'Signalement d\'un bug, problème d\'accès ou question générale sur nos services numériques.',
    email: 'Contact@scoop-afrique.com',
    subject: 'Support',
  },
]

const socials = [
  { name: 'TikTok', href: 'https://www.tiktok.com/@Scoop.Afrique' },
  { name: 'Instagram', href: 'https://www.instagram.com/Scoop.Afrique' },
  { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61568464568442' },
]

export default function ContactPage() {
  return (
    <ReaderLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>

        {/* Header */}
        <header className="mb-12 border-b border-border pb-10">
          <SectionHeader label="Contact" variant="editorial" className="mb-5" />
          <Heading
            as="h1"
            level="h1"
            className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Parlons-nous
          </Heading>
          <p className="max-w-xl font-sans text-lg leading-relaxed text-muted-foreground">
            Une proposition, un partenariat, une question ? L&apos;équipe Scoop Afrique répond sous 24–48 h.
          </p>
        </header>

        {/* Contact info */}
        <section className="mb-12" aria-label="Informations de contact">
          <div className="grid gap-4 sm:grid-cols-3">
            {contactInfo.map((info) => (
              <div
                key={info.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8">
                  <info.icon className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {info.title}
                  </p>
                  {info.href ? (
                    <a
                      href={info.href}
                      className="mt-1 block font-sans text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-sans text-sm text-foreground">{info.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main form */}
        <section className="mb-14" aria-labelledby="form-heading">
          <SectionHeader label="Envoyer un message" variant="editorial" className="mb-6" />
          <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8">
            <ContactLeadForm />
          </div>
        </section>

        {/* Departments */}
        <section className="mb-14" aria-labelledby="dept-heading">
          <SectionHeader label="Par département" variant="editorial" className="mb-6" id="dept-heading" />
          <div className="space-y-3">
            {departments.map((dept) => (
              <div
                key={dept.title}
                className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <h3 className="font-sans text-sm font-bold text-foreground">{dept.title}</h3>
                  <p className="mt-0.5 font-sans text-xs leading-relaxed text-muted-foreground">
                    {dept.description}
                  </p>
                </div>
                <a
                  href={`mailto:${dept.email}?subject=${encodeURIComponent(dept.subject)}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 font-sans text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.97]"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden />
                  Contacter
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Socials */}
        <section className="overflow-hidden rounded-2xl border-l-[6px] border-l-primary bg-muted/50 p-8">
          <h2
            className="mb-2 text-xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Réponse rapide sur les réseaux
          </h2>
          <p className="mb-6 font-sans text-sm text-muted-foreground">
            Nos équipes sont actives sur les réseaux. Pour une réponse immédiate, envoyez-nous un DM.
          </p>
          <div className="flex flex-wrap gap-3">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border-2 border-primary bg-transparent px-5 py-2.5 font-sans text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.97]"
              >
                {s.name}
              </a>
            ))}
          </div>
        </section>
      </div>
    </ReaderLayout>
  )
}
