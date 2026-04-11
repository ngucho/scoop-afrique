import type { LucideIcon } from 'lucide-react'
import { Video, FileText, Music, Mic2, Handshake } from 'lucide-react'

export interface ServiceOffer {
  slug: string
  title: string
  tagline: string
  price: string
  priceNote?: string
  icon: LucideIcon
  image: string
  category: 'couverture' | 'contenu' | 'partenariat'
  summary: string
  why: string[]
  howWeDeliver: string[]
  deliverables: string[]
  idealFor: string[]
  turnaround?: string
  priceRationale?: string
  ctaHref: string
}

/**
 * Grille tarifaire V2 — mars 2026 (réf. marketing interne publiée côté annonceurs).
 * Aucune prestation catalogue en dessous de 50 000 FCFA ; le post simple est la référence à 50 000 FCFA.
 */
export const serviceOffers: ServiceOffer[] = [
  {
    slug: 'couverture-mediatique',
    title: 'Couverture médiatique événementielle',
    tagline: 'Terrain, captation, montage : votre événement livré clé en main',
    price: '175 000 – 550 000 FCFA',
    priceNote: 'Classique à Gold étendu — multi-jours / festival sur devis (dès 600 000 FCFA)',
    icon: Video,
    image: '/images/offre-couverture.jpg',
    category: 'couverture',
    summary:
      'Équipe sur place (demi-journée à journée complète), posts & stories, photos HD, reels et vidéo récap selon formule. Conçu pour refléter la charge réelle terrain + post-production.',
    why: [
      'Couverture pro sans monter une équipe interne',
      'Livrables prêts pour vos réseaux et les nôtres',
      'Formules calées sur la durée terrain et le volume de montage',
    ],
    howWeDeliver: [
      'Brief, planning, accréditations et périmètre des moments forts',
      'Captation photo & vidéo sur site ; minimum 2 personnes pour les formules Gold',
      'Montage, habillage et validation avant diffusion',
      'Publication coordonnée sur TikTok, Facebook, Instagram, Threads, YouTube selon le pack',
    ],
    deliverables: [
      'Classique (≤4 h terrain) : 2 posts + 3 stories + photos HD — 175 000 FCFA plein tarif',
      'Premium (≤8 h terrain) : 3 posts + 5 stories + photos HD + 1 reel 30 s — 280 000 FCFA',
      'Gold (journée complète) : 5 posts + stories illimitées + photos HD + vidéo récap 2–3 min — 400 000 FCFA',
      'Gold étendu : pack Gold + article site + interview vidéo montée (5–7 min) — 550 000 FCFA',
      'Sur devis : festivals, galas, multi-jours — à partir de 600 000 FCFA',
    ],
    idealFor: [
      'Concerts, festivals, lancements, cérémonies',
      'Marques et institutions en terrain',
      'Promoteurs qui veulent un combo promo + jour J (voir offre promo)',
    ],
    turnaround: 'Selon formule et validation — délais précisés au devis',
    priceRationale:
      'La grille V2 ancre les couvertures sur une charge réelle (terrain + montage). En dessous du palier Classique, la prestation n’est pas proposée : nous préférons un périmètre clair et défendable.',
    ctaHref: '/demander-devis?service=couverture-mediatique',
  },
  {
    slug: 'publication',
    title: 'Publication sponsorisée',
    tagline: 'Du post simple au pack premium — sans terrain, avec exigence de production',
    price: '50 000 – 90 000 FCFA',
    priceNote: 'Entrée de gamme : post classique multi-plateformes — 50 000 FCFA plein tarif',
    icon: FileText,
    image: '/images/offre-publication.jpg',
    category: 'contenu',
    summary:
      'Diffusion sur TikTok, Facebook, Instagram et Threads : mise en page, rédaction et programmation. Notre entrée de gamme est le post classique à 50 000 FCFA (visuel client) ; les formules avec design ou article sont au-delà.',
    why: [
      'Annoncer un message avec la voix Scoop Afrique',
      'Pas de déplacement : délai maîtrisé côté studio',
      'Échelle de prix lisible (50 K → 90 K) avant packs multi-publications',
    ],
    howWeDeliver: [
      'Brief : message, visuels, mentions légales, CTA',
      'Design et/ou rédaction selon formule ; validation avant mise en ligne',
      'Programmation multi-plateformes ; article web si inclus',
    ],
    deliverables: [
      'Post classique (visuel client) : TikTok + Facebook + Instagram + Threads — 50 000 FCFA',
      'Post + design Scoop : même diffusion — 65 000 FCFA',
      'Premium : 1 post + 1 story IG/FB + 1 article web (visuel client) — 75 000 FCFA',
      'Premium + design : création graphique incluse — 90 000 FCFA',
      'Packs 3 posts ou mensuels : voir grille tarifaire — économies à la clé',
    ],
    idealFor: [
      'Annonces ponctuelles, communiqués adaptés au social',
      'Marques qui fournissent le visuel ou qui passent par notre design',
      'Tests avant un partenariat long',
    ],
    turnaround: 'Typiquement sous 48–72 h après validation du contenu',
    priceRationale:
      'La V2 fixe le plancher public à 50 000 FCFA pour un post simple (~45 min de charge). Nous ne proposons pas de publication « mini » en dessous : cela garantit qualité et temps de production.',
    ctaHref: '/demander-devis?service=publication',
  },
  {
    slug: 'promo-concert-evenement',
    title: 'Promo concert, événement & artiste',
    tagline: 'Campagnes digitales sans terrain — concerts, sorties, lancements',
    price: '100 000 – 700 000 FCFA',
    priceNote:
      'Promo digitale (starter → Gold+) ; promotion artiste (découverte, single, album) : 100 000 – 480 000+ FCFA',
    icon: Music,
    image: '/images/offre-campagnes.jpg',
    category: 'contenu',
    summary:
      'Création graphique, rédaction, programmation et animation communautaire sur plusieurs jours. Du pack Starter annonce au Gold+ qui combine promo complète et présence physique le jour J.',
    why: [
      'Rythme de campagne aligné sur votre date butoir',
      'Charge design + community prise en compte dans les paliers',
      'Combo Gold+ : promo + couverture terrain le jour J (meilleure marge pour vous comme pour nous)',
    ],
    howWeDeliver: [
      'Calendrier J-7 à J-3 semaines selon formule',
      'Création des visuels, textes, reels ; modération et relances si prévu',
      'Option jour J : coordination avec l’offre couverture Gold',
    ],
    deliverables: [
      'Promo concert / événement — Starter : 2 posts + 1 story — 100 000 FCFA',
      'Classique : 4 posts + 3 stories + 1 reel teaser — 175 000 FCFA',
      'Premium : 6 posts + stories quotidiennes + 1 reel + article — 260 000 FCFA',
      'Gold : 8 posts + stories illimitées + 2 reels + jeu concours + article — 380 000 FCFA',
      'Gold+ : tout Gold + présence physique Gold le jour J — 700 000 FCFA',
      'Promotion artiste — Découverte : 100 000 · Single : 250 000 · Album : 480 000 · Longue durée : sur devis (dès 600 000)',
    ],
    idealFor: [
      'Promoteurs, salles, labels',
      'Artistes en phase single / album',
      'Marques qui sponsorisent des événements culturels',
    ],
    turnaround: '1 à 4 semaines selon l’ampleur de la campagne',
    priceRationale:
      'Les paliers reflètent des heures de design et de suivi sur plusieurs jours. Le Gold+ regroupe deux lignes de revenus (promo + terrain) : c’est souvent le meilleur rapport impact / budget pour les concerts.',
    ctaHref: '/demander-devis?service=promo-concert-evenement',
  },
  {
    slug: 'interview-reportage',
    title: 'Interview & reportage',
    tagline: 'Tournage, montage, diffusion — formats standard à mini-reportage',
    price: '150 000 – 400 000 FCFA',
    priceNote: 'Standard 150 000 FCFA plein tarif — séries et formats longs en hausse',
    icon: Mic2,
    image: '/images/offre-sponsorise.jpg',
    category: 'contenu',
    summary:
      'Interview terrain à Abidjan ou formats plus lourds : la charge inclut déplacement, tournage, montage et publication. Pas de petite offre « express » en dessous du standard : le minimum reflète ~5 h de travail.',
    why: [
      'Contenu crédible pour fondateurs, artistes, institutions',
      'Découpes possibles pour les réseaux après validation',
      'Échelle claire du standard au mini-reportage',
    ],
    howWeDeliver: [
      'Préparation des questions et du lieu',
      'Tournage (1–2 h ou demi-journée selon format)',
      'Montage, versions courtes si prévues, mise en ligne',
    ],
    deliverables: [
      'Standard (5–10 min, 1 interviewé, Abidjan) : vidéo + 1 post + 1 story — 150 000 FCFA',
      'Sponsorisée branded : vidéo + article + 2 posts — 200 000 FCFA',
      'Mini-reportage (3–5 min, équipe 2 pers.) : vidéo + photos + article — 300 000 FCFA',
      'Série 3 épisodes (3 × standard sur 3 semaines) — 400 000 FCFA',
    ],
    idealFor: [
      'Dirigeants, artistes, porte-parole',
      'Documenter un lieu ou une initiative (mini-reportage)',
      'Campagnes en plusieurs temps (série)',
    ],
    turnaround: 'Quelques jours à 2 semaines selon complexité',
    priceRationale:
      'Sous 150 000 FCFA, une interview terrain montée et publiée ne couvre pas nos coûts — la V2 fixe donc ce plancher pour le standard.',
    ctaHref: '/demander-devis?service=interview-reportage',
  },
  {
    slug: 'partenariat-marque',
    title: 'Partenariat de marque (brand deal mensuel)',
    tagline: 'Présence récurrente, volume de contenu, engagement minimum 3 mois',
    price: 'À partir de 300 000 FCFA / mois',
    priceNote: 'Essentiel à Gold exclusif (1 200 000 FCFA/mois) — 6 mois min. pour l’exclusivité catégorielle',
    icon: Handshake,
    image: '/images/offre-partenariat.jpg',
    category: 'partenariat',
    summary:
      'Collaboration mensuelle : posts, stories, articles, parfois interview récurrente. La formule Essentiel démarre à 300 000 FCFA / mois ; les paliers supérieurs ajoutent volume et services (analytics, exclusivité).',
    why: [
      'Visibilité continue plutôt que one-shot',
      'Cadence et reporting négociés dès le contrat',
      'Priorité commerciale : revenus récurrents pour sécuriser la production',
    ],
    howWeDeliver: [
      'Kick-off : objectifs, charte, calendrier, KPIs',
      'Production mensuelle selon la formule ; validation des créas',
      'Rapport d’activité ; option analytics renforcés (Gold exclusif)',
    ],
    deliverables: [
      'Essentiel : 4 posts + 4 stories / mois — 300 000 FCFA',
      'Premium : 8 posts + 8 stories + 2 articles web — 500 000 FCFA',
      'Gold : 12 posts + stories illimitées + 4 articles + 1 interview / mois — 800 000 FCFA',
      'Gold exclusif : tout Gold + exclusivité catégorielle + rapport analytics — 1 200 000 FCFA / mois (engagement 6 mois)',
    ],
    idealFor: [
      'Marques structurées sur 3–12 mois',
      'Grands comptes, institutions, scale-ups',
      'Acteurs qui veulent une présence toujours active',
    ],
    turnaround: 'Démarrage sous ~2 semaines après contrat et acompte',
    priceRationale:
      'La V2 repositionne l’entrée du brand deal à 300 000 FCFA / mois pour refléter ~8 h de charge mensuelle minimum. Les remises fidélité (ex. 15 % dès le 2e trimestre) se discutent dans le cadre commercial, pas sur le site.',
    ctaHref: '/demander-devis?service=partenariat-marque',
  },
]

export const couvertureFormules = [
  {
    title: 'Classique',
    price: '175 000 FCFA',
    items: [
      'Demi-journée terrain (≤ 4 h)',
      '2 posts + 3 stories + photos HD',
      'Charge estimée ~7–8 h (terrain + montage + design)',
    ],
    image: '/images/video-classique.jpg',
  },
  {
    title: 'Premium',
    price: '280 000 FCFA',
    items: [
      'Journée terrain (≤ 8 h)',
      '3 posts + 5 stories + photos HD + 1 reel 30 s',
      'Charge estimée ~12–15 h',
    ],
    image: '/images/video-premium.jpg',
  },
  {
    title: 'Gold',
    price: '400 000 FCFA',
    items: [
      'Journée complète terrain',
      '5 posts + stories illimitées + photos HD + vidéo récap 2–3 min',
      '2 membres d’équipe minimum — charge ~16–18 h',
    ],
    image: '/images/video-gold.jpg',
  },
  {
    title: 'Gold étendu',
    price: '550 000 FCFA',
    items: [
      'Tout le pack Gold',
      '+ article rédactionnel site + interview vidéo montée (5–7 min)',
      'Charge estimée ~22–25 h',
    ],
    image: '/images/video-gold-plus.jpg',
  },
]

const slugMap = new Map(serviceOffers.map((s) => [s.slug, s]))

export function getServiceBySlug(slug: string): ServiceOffer | undefined {
  return slugMap.get(slug)
}

export function getAllServiceSlugs(): string[] {
  return serviceOffers.map((s) => s.slug)
}
