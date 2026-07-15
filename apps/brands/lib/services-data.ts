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

export const serviceOffers: ServiceOffer[] = [
  {
    slug: 'couverture-mediatique',
    title: 'Couverture media terrain',
    tagline: 'Le jour J filme, raconte et diffuse avec une vraie puissance sociale',
    price: '350 000 - 1 200 000 FCFA',
    priceNote: 'Demi-journee, journee, recap premium ou dispositif multi-jours',
    icon: Video,
    image: '/images/offre-couverture.jpg',
    category: 'couverture',
    summary:
      "Equipe terrain, photos, videos courtes, stories, recap et diffusion sur l'ecosysteme Scoop Afrique. Pense pour les evenements qui veulent exister dans la rue, sur les reseaux et dans la memoire.",
    why: [
      "Transformer un evenement en contenu exploitable avant, pendant et apres",
      "Profiter d'une audience sociale massive sans monter une redaction interne",
      "Garder une qualite editoriale compatible avec une marque ambitieuse",
    ],
    howWeDeliver: [
      'Brief editorial, moments forts, planning et contraintes terrain',
      'Captation photo/video par equipe mobile Scoop Afrique',
      'Montage vertical, habillage, validation rapide et diffusion coordonnee',
      'Reporting simple: liens, publications, captures et signaux de performance',
    ],
    deliverables: [
      'Impact: demi-journee, 2 posts, 5 stories, galerie photo - 350 000 FCFA',
      'Prime: journee, 4 posts, stories, 1 reel, photos HD - 600 000 FCFA',
      'Signature: journee complete, 6 posts, 2 reels, recap 2-3 min, article - 900 000 FCFA',
      'Festival / multi-jours: dispositif equipe + calendrier de contenus - des 1 200 000 FCFA',
    ],
    idealFor: ['Lancements', 'Conferences', 'Concerts', 'Institutions', 'Festivals', 'Marques terrain'],
    turnaround: 'Premiers contenus le jour J selon brief; recap sous quelques jours apres validation.',
    priceRationale:
      "La grille tient compte du nouveau niveau d'audience, du temps terrain, du montage et de la diffusion multi-plateformes.",
    ctaHref: '/demander-devis?service=couverture-mediatique',
  },
  {
    slug: 'publication',
    title: 'Publication sponsorisee premium',
    tagline: 'Un message de marque reformule pour une audience africaine connectee',
    price: '90 000 - 250 000 FCFA',
    priceNote: 'Post simple, design, article web, pack multi-publications',
    icon: FileText,
    image: '/images/offre-publication.jpg',
    category: 'contenu',
    summary:
      "Publication native sur TikTok, Facebook, Instagram et Threads, avec adaptation du texte, visuel ou design Scoop et option article pour les campagnes qui demandent plus de contexte.",
    why: [
      "Sortir du simple copier-coller publicitaire",
      "Faire passer un message clair dans les codes sociaux de Scoop Afrique",
      "Tester une prise de parole avant une campagne plus large",
    ],
    howWeDeliver: [
      'Brief message, cible, preuve, CTA et mentions obligatoires',
      'Reformulation editoriale et/ou creation visuelle',
      'Programmation multi-plateformes et controle de publication',
    ],
    deliverables: [
      'Post natif multi-plateformes avec visuel client - 90 000 FCFA',
      'Post + design Scoop - 130 000 FCFA',
      'Post + story + article site - 180 000 FCFA',
      'Pack 3 publications natives - des 250 000 FCFA',
    ],
    idealFor: ['Communiques adaptes', 'Promotions', 'Appels a candidatures', 'Annonces produits'],
    turnaround: '48 a 72 h apres reception des elements et validation.',
    priceRationale:
      "Le plancher remonte car l'inventaire social et la qualite editoriale ne sont plus ceux d'un media en lancement.",
    ctaHref: '/demander-devis?service=publication',
  },
  {
    slug: 'promo-concert-evenement',
    title: 'Campagne sociale 360',
    tagline: 'Avant, pendant, apres: faire monter la conversation jusqu au jour J',
    price: '300 000 - 1 500 000 FCFA',
    priceNote: 'Concert, artiste, evenement culturel, lancement ou campagne institutionnelle',
    icon: Music,
    image: '/images/offre-campagnes.jpg',
    category: 'contenu',
    summary:
      'Calendrier social, creation graphique, reels, stories, posts, jeu concours, animation communautaire et option presence terrain. Une campagne pensee comme une sequence, pas comme une publication isolee.',
    why: [
      'Creer de la repetition sans saturer le public',
      'Installer une date, une cause ou une sortie dans la conversation',
      'Combiner production sociale et couverture terrain si necessaire',
    ],
    howWeDeliver: [
      'Strategie de campagne et calendrier editorial',
      'Production des assets sociaux et textes',
      'Diffusion progressive, relances, stories et recap',
      'Option terrain pour relier la campagne au jour J',
    ],
    deliverables: [
      'Starter: 4 posts + stories + kit annonce - 300 000 FCFA',
      'Momentum: 8 posts + stories + 2 reels + article - 650 000 FCFA',
      'Signature: campagne complete + jeu concours + recap - 950 000 FCFA',
      '360 terrain: campagne + presence jour J + recap premium - des 1 500 000 FCFA',
    ],
    idealFor: ['Concerts', 'Albums', 'Festivals', 'Lancements', 'Campagnes publiques'],
    turnaround: 'Idealement 2 a 4 semaines avant la date cle.',
    priceRationale:
      'La valeur vient de la sequence: strategie, creation, frequence, moderation et diffusion sur une audience massive.',
    ctaHref: '/demander-devis?service=promo-concert-evenement',
  },
  {
    slug: 'interview-reportage',
    title: 'Interview & reportage de marque',
    tagline: "Donner du fond a une voix, une initiative ou un projet",
    price: '300 000 - 900 000 FCFA',
    priceNote: 'Interview standard, format branded, mini-doc, serie',
    icon: Mic2,
    image: '/images/offre-sponsorise.jpg',
    category: 'contenu',
    summary:
      'Preparation editoriale, tournage, montage, formats courts et diffusion. Pour les dirigeants, artistes, institutions ou initiatives qui doivent expliquer, pas seulement annoncer.',
    why: [
      'Construire de la credibilite autour d une personne ou d un projet',
      'Obtenir un contenu reutilisable en formats courts',
      'Associer la marque a un recit africain plus profond',
    ],
    howWeDeliver: [
      'Angle, questions, lieu et preparation',
      'Tournage terrain ou studio leger',
      'Montage long + extraits courts selon formule',
      'Publication et distribution sur les canaux choisis',
    ],
    deliverables: [
      'Interview standard: video + posts + stories - 300 000 FCFA',
      'Branded story: video + article + 3 formats courts - 500 000 FCFA',
      'Mini-reportage: tournage renforce + recap + article - 750 000 FCFA',
      'Serie: 3 episodes courts + distribution - des 900 000 FCFA',
    ],
    idealFor: ['Fondateurs', 'Institutions', 'Artistes', 'ONG', 'Marques a impact'],
    turnaround: 'Une a trois semaines selon le niveau de production.',
    priceRationale:
      "Le format demande preparation, tournage, montage et responsabilite editoriale: le prix protege la qualite du recit.",
    ctaHref: '/demander-devis?service=interview-reportage',
  },
  {
    slug: 'partenariat-marque',
    title: 'Partenariat de marque',
    tagline: 'Une presence recurrente dans un media qui grandit avec son audience',
    price: 'A partir de 1 000 000 FCFA / mois',
    priceNote: 'Engagement recommande 3 a 6 mois; exclusivite sur devis',
    icon: Handshake,
    image: '/images/offre-partenariat.jpg',
    category: 'partenariat',
    summary:
      "Un deal mensuel pour les marques qui veulent une presence continue: contenus sociaux, articles, activations, interviews, reporting et priorite editoriale compatible avec nos valeurs.",
    why: [
      'Sortir du one-shot et construire une place durable',
      'Profiter du cumul audience + repetition + confiance',
      'Associer la marque a une Afrique ambitieuse, concrete et visible',
    ],
    howWeDeliver: [
      'Kick-off objectifs, messages, calendrier et limites editoriales',
      'Production mensuelle selon le volume negocie',
      'Points de suivi, optimisation et reporting',
      'Option exclusivite categorie ou programme dedie',
    ],
    deliverables: [
      'Essentiel: presence mensuelle multi-formats - des 1 000 000 FCFA / mois',
      'Influence: volume social + articles + interview - des 1 800 000 FCFA / mois',
      'Territoire: programme sponsorise ou exclusivite categorie - sur devis',
    ],
    idealFor: ['Grandes marques', 'Institutions', 'Fintech', 'Telecoms', 'Culture', 'Education'],
    turnaround: 'Demarrage sous 2 semaines apres validation contractuelle.',
    priceRationale:
      "Le partenariat vend une relation durable avec l'audience et une capacite de production, pas seulement un nombre de posts.",
    ctaHref: '/demander-devis?service=partenariat-marque',
  },
]

export const couvertureFormules = [
  {
    title: 'Impact',
    price: '350 000 FCFA',
    items: ['Demi-journee terrain', '2 posts + 5 stories + photos HD', 'Premiers contenus pendant ou juste apres evenement'],
    image: '/images/video-classique.jpg',
  },
  {
    title: 'Prime',
    price: '600 000 FCFA',
    items: ['Journee terrain', '4 posts + stories + photos HD', '1 reel vertical monte'],
    image: '/images/video-premium.jpg',
  },
  {
    title: 'Signature',
    price: '900 000 FCFA',
    items: ['Journee complete', '6 posts + 2 reels + recap 2-3 min', 'Article site inclus'],
    image: '/images/video-gold.jpg',
  },
  {
    title: 'Festival',
    price: 'Des 1 200 000 FCFA',
    items: ['Multi-jours ou gros dispositif', 'Equipe renforcee', 'Calendrier de contenus et reporting'],
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
