import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { LegalNav } from '@/components/legal/LegalNav'
import { Heading } from 'scoop'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Politique de confidentialité de Scoop.Afrique : données collectées, finalités, cookies, sous-traitants (Auth0, hébergeur), durées de conservation et vos droits.',
}

const backLinkClass =
  'inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary'

export default function PolitiqueConfidentialitePage() {
  return (
    <ReaderLayout>
      <main className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <Link href="/" className={backLinkClass}>
              <ArrowLeft className="h-4 w-4" />
              Retour à l&apos;accueil
            </Link>
          </div>
        </header>
        <article className="mx-auto max-w-4xl px-6 py-16">
          <Heading as="h1" level="h1" className="mb-4">
            Politique de confidentialité
          </Heading>
          <p className="mb-12 text-muted-foreground">Dernière mise à jour : avril 2026</p>
          <div className="space-y-8">
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                1. Introduction
              </Heading>
              <p className="text-muted-foreground">
                La présente politique décrit comment <strong>SCOOP AFRIQUE</strong>, éditeur du site{' '}
                <strong>Scoop.Afrique</strong>, traite les données personnelles des visiteurs, abonnés newsletter,
                utilisateurs de compte lecteur (Tribune, préférences) et contacts professionnels. Elle complète nos{' '}
                <Link href="/mentions-legales" className="text-primary hover:underline">
                  Mentions légales
                </Link>{' '}
                et nos{' '}
                <Link href="/cgu" className="text-primary hover:underline">
                  CGU
                </Link>
                .
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                2. Responsable du traitement
              </Heading>
              <p className="text-muted-foreground">
                <strong>Responsable</strong> : SCOOP AFRIQUE — siège : Abidjan, Cocody Riviera Faya, Lot 7, Ilot 6 — 01
                BP 130 Abidjan 01, Côte d&apos;Ivoire. <strong>Contact données</strong> :{' '}
                <a href="mailto:Contact@scoop-afrique.com" className="text-primary hover:underline">
                  Contact@scoop-afrique.com
                </a>
                .
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                3. Données collectées
              </Heading>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                  <strong>Données que vous nous transmettez</strong> : adresse e-mail et informations de profil lors de
                  l&apos;inscription newsletter (avec confirmation par lien), création d&apos;un compte lecteur, formulaire
                  de contact ou demandes partenaires ; contenus que vous publiez dans les espaces communautaires le cas
                  échéant.
                </li>
                <li>
                  <strong>Données techniques</strong> : identifiants de connexion sécurisés (fournis par notre
                  prestataire d&apos;authentification), journaux techniques, adresse IP, type d&apos;appareil et de
                  navigateur, pages consultées et horodatages, dans la mesure nécessaire au fonctionnement et à la
                  sécurité du service.
                </li>
                <li>
                  <strong>Cookies et traceurs</strong> : voir section 6.
                </li>
              </ul>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                4. Finalités et bases légales
              </Heading>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                  <strong>Fourniture du site et du compte lecteur</strong> : exécution des CGU et mesures précontractuelles
                  à votre demande.
                </li>
                <li>
                  <strong>Newsletter</strong> : envoi d&apos;informations sur nos contenus, sur la base de votre
                  consentement (inscription confirmée par e-mail). Vous pouvez vous désinscrire à tout moment.
                </li>
                <li>
                  <strong>Réponses aux demandes</strong> (contact, partenariats) : intérêt légitime ou exécution de
                  mesures précontractuelles.
                </li>
                <li>
                  <strong>Mesure d&apos;audience et amélioration du service</strong> : selon votre choix de cookies
                  (consentement lorsque requis) et intérêt légitime pour les mesures strictement nécessaires.
                </li>
                <li>
                  <strong>Obligations légales</strong> : conservation ou communication lorsque la loi l&apos;exige.
                </li>
              </ul>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                5. Destinataires et sous-traitants
              </Heading>
              <p className="mb-2 text-muted-foreground">
                Vos données peuvent être traitées par des prestataires agissant sur nos instructions :
              </p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                  <strong>Hébergement et diffusion</strong> du site et des API (ex. Vercel, infrastructures cloud).
                </li>
                <li>
                  <strong>Authentification des comptes</strong> (ex. Auth0 — États-Unis / transferts encadrés par des
                  clauses contractuelles types ou mécanismes reconnus).
                </li>
                <li>
                  <strong>Envoi d&apos;e-mails transactionnels et newsletter</strong> (ex. fournisseur de messagerie
                  transactionnelle).
                </li>
                <li>
                  <strong>Hébergement de données</strong> (bases de données, fichiers) sur des serveurs situés dans
                  l&apos;UE ou des pays offrant un niveau de protection reconnu ou des garanties appropriées.
                </li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                Nous ne vendons pas vos données personnelles. Un transfert hors de votre pays de résidence peut avoir
                lieu lorsque le prestataire est établi à l&apos;étranger ; dans ce cas, nous veillons au respect des
                garanties requises par la réglementation applicable.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                6. Cookies
              </Heading>
              <p className="text-muted-foreground">
                Nous utilisons des cookies et technologies similaires : cookies strictement nécessaires au fonctionnement
                et à la sécurité ; cookies de préférences (ex. mémorisation de vos choix) ; le cas échéant, cookies
                d&apos;analyse ou de publicité après votre accord via le bandeau. Vous pouvez modifier les paramètres de
                votre navigateur ; le refus de certains cookies peut limiter des fonctionnalités.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                7. Durées de conservation
              </Heading>
              <p className="text-muted-foreground">
                Les données sont conservées pendant la durée nécessaire aux finalités poursuivies : par exemple, durée de
                la relation pour le compte lecteur ; jusqu&apos;à désinscription pour la newsletter ; durées légales pour
                les obligations comptables ou contentieuses le cas échéant. Les journaux techniques sont conservés pour une
                durée limitée compatible avec la sécurité et la résolution d&apos;incidents.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                8. Sécurité
              </Heading>
              <p className="text-muted-foreground">
                Nous appliquons des mesures techniques et organisationnelles appropriées (chiffrement en transit,
                contrôle d&apos;accès, authentification sécurisée) pour protéger vos données contre la perte, l&apos;accès
                non autorisé ou la divulgation.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                9. Vos droits
              </Heading>
              <p className="text-muted-foreground">
                Selon le droit applicable (notamment pour les personnes concernées dans l&apos;Union européenne ou au
                Royaume-Uni), vous pouvez disposer des droits d&apos;accès, de rectification, d&apos;effacement, de
                limitation du traitement, d&apos;opposition, de portabilité et du retrait du consentement lorsque le
                traitement est fondé sur celui-ci. Les utilisateurs en Côte d&apos;Ivoire peuvent également nous contacter
                pour l&apos;exercice de droits reconnus par la loi locale. Pour toute demande :{' '}
                <a href="mailto:Contact@scoop-afrique.com" className="text-primary hover:underline">
                  Contact@scoop-afrique.com
                </a>
                . Vous pouvez introduire une réclamation auprès de l&apos;autorité de protection des données compétente.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                10. Modifications
              </Heading>
              <p className="text-muted-foreground">
                Nous pouvons mettre à jour cette politique ; la date en tête de page sera révisée. Les changements
                substantiels pourront être portés à votre attention sur le site ou par e-mail lorsque la loi l&apos;exige.
              </p>
            </section>
          </div>
          <LegalNav current="confidentialite" />
        </article>
      </main>
    </ReaderLayout>
  )
}
