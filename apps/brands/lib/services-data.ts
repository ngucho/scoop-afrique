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
  /** Résumé court pour les cartes */
  summary: string
  /** Pourquoi ce service — besoins couverts */
  why: string[]
  /** Comment nous livrons — process */
  howWeDeliver: string[]
  /** Livrables inclus */
  deliverables: string[]
  /** Idéal pour */
  idealFor: string[]
  /** Délai typique */
  turnaround?: string
  /** Note sur le prix (rationale) */
  priceRationale?: string
  /** CTA href */
  ctaHref: string
}

export const serviceOffers: ServiceOffer[] = [
  {
    slug: 'couverture-mediatique',
    title: 'Couverture médiatique événementielle',
    tagline: 'Votre événement sous les projecteurs de l\'audience panafricaine',
    price: '150 000 – 750 000 FCFA',
    priceNote: 'Selon la formule (Classique à Gold+)',
    icon: Video,
    image: '/images/offre-couverture.jpg',
    category: 'couverture',
    summary: 'Présence sur place, captage professionnel, diffusion multi-plateformes. De la formule Classique au pack Gold+ avec vlog YouTube dédié.',
    why: [
      'Donner de la visibilité à votre événement (concert, lancement, festival, conférence) auprès d\'une audience jeune et engagée',
      'Bénéficier d\'une couverture professionnelle sans investir dans une équipe de tournage dédiée',
      'Générer du contenu réutilisable (recap, moments forts) pour vos propres canaux',
      'Associer votre marque à un média de référence auprès de la jeunesse africaine francophone',
    ],
    howWeDeliver: [
      'Préparation en amont : brief, planning, validation des moments clés à capturer',
      'Équipe sur place le jour J : caméraman(s), monteur si formule Premium+',
      'Captage ambiance, interviews express, tapis rouge (formules Gold)',
      'Montage et diffusion sous 24–72 h sur TikTok, Instagram, Facebook, YouTube',
      'Recap unifié avec votre branding et mentions officielles',
    ],
    deliverables: [
      'Vidéos courtes (60–90 s) optimisées pour chaque plateforme',
      'Stories et posts avec visuels et mentions',
      'Vidéo recap de l\'événement (formules Premium à Gold+)',
      'Vlog YouTube dédié (formule Gold+ uniquement)',
    ],
    idealFor: [
      'Organisateurs de concerts et festivals',
      'Marques lançant un produit ou une campagne',
      'Institutions et événements corporate',
      'Artistes et labels promouvant une sortie',
    ],
    turnaround: 'Diffusion sous 24–72 h après l\'événement',
    priceRationale: 'Nos tarifs reflètent une structure agile : équipe réduite, process optimisé, pas de surcoûts superflus. Nous privilégions la qualité et la réactivité pour des prestations accessibles aux PME et startups ivoiriennes et africaines.',
    ctaHref: '/demander-devis?service=couverture-mediatique',
  },
  {
    slug: 'publication',
    title: 'Publication sponsorisée',
    tagline: 'Une publication, cinq plateformes, des millions de vues potentielles',
    price: '50 000 – 75 000 FCFA',
    priceNote: 'Formule Classique ou Premium',
    icon: FileText,
    image: '/images/offre-publication.jpg',
    category: 'contenu',
    summary: '1 publication diffusée sur TikTok, Instagram, Facebook, YouTube. Formule Premium : post + stories + article dédié.',
    why: [
      'Toucher rapidement une audience de 1,25 M+ d\'abonnés sans gérer vous-même la création de contenu',
      'Annoncer un produit, un événement ou une actualité avec la crédibilité d\'un média reconnu',
      'Obtenir une visibilité ciblée auprès de la jeunesse africaine francophone (16–35 ans)',
      'Tester l\'impact de la publicité native à moindre coût avant d\'envisager des campagnes long terme',
    ],
    howWeDeliver: [
      'Réception de votre brief (message clé, visuels ou idées, CTA souhaité)',
      'Création ou adaptation du contenu aux codes de chaque plateforme',
      'Publication coordonnée sur tous nos réseaux le jour convenu',
      'Option Premium : stories dédiées + article sur notre site / newsletter',
    ],
    deliverables: [
      '1 post multi-plateformes (TikTok, Instagram, Facebook, YouTube) — Formule Classique',
      'Post + 3–5 stories + article — Formule Premium',
      'Rapport de performance (vues, likes, partages) sur demande',
    ],
    idealFor: [
      'PME et startups lançant une offre',
      'Artistes annonçant une sortie ou une tournée',
      'Événements cherchant une visibilité rapide',
      'Marques testant le marché ivoirien et africain',
    ],
    turnaround: 'Publication sous 3–5 jours ouvrés après validation du contenu',
    priceRationale: 'À titre de comparaison, une publication one-shot avec un micro-influenceur en Côte d\'Ivoire se situe entre 50 000 et 200 000 FCFA. Nous proposons une diffusion sur 5 plateformes et une audience cumulée supérieure à 1 million, avec la crédibilité d\'un média éditorial.',
    ctaHref: '/demander-devis?service=publication',
  },
  {
    slug: 'promo-concert-evenement',
    title: 'Promo concert & événement',
    tagline: 'Annonce, rappel, micro-trottoir : une campagne clé en main pour remplir vos salles',
    price: '150 000 – 600 000 FCFA',
    priceNote: 'Packs modulables selon l\'envergure',
    icon: Music,
    image: '/images/offre-campagnes.jpg',
    category: 'contenu',
    summary: 'Annonce de l\'événement, posts de rappel, micro-trottoir et teasing. Pack complet J-J disponible pour une visibilité maximale.',
    why: [
      'Augmenter la notoriété de votre événement en amont et le jour J',
      'Créer du buzz autour des artistes, du lieu et de l\'ambiance attendue',
      'Toucher une audience locale et panafricaine (diaspora incluse)',
      'Maximiser les ventes de billets et la fréquentation',
    ],
    howWeDeliver: [
      'Pack Annonce : 1–2 posts de lancement + stories sur nos réseaux',
      'Pack Rappel : annonce + 2–3 rappels stratégiques (J-7, J-3, J-1)',
      'Pack Complet J-J : annonce + rappels + micro-trottoir le jour J + recap post-événement',
      'Création de visuels et scripts adaptés à votre charte',
    ],
    deliverables: [
      'Posts de lancement et rappels (format vidéo court ou carrousel)',
      'Micro-trottoir (avis du public, ambiance) le jour J — Pack Complet',
      'Stories et teasers dédiés',
      'Recap post-événement pour prolonger la visibilité',
    ],
    idealFor: [
      'Promoteurs de concerts et festivals',
      'Salles de spectacle et clubs',
      'Labels et artistes en tournée',
      'Événements culturels et lifestyle',
    ],
    turnaround: 'Diffusion selon le planning convenu (J-14 à J+1)',
    priceRationale: 'Une campagne complète avec un influenceur macro peut atteindre 300 000 à 1 000 000 FCFA par action. Notre pack complet inclut plusieurs touchpoints et une couverture éditoriale professionnelle, à un tarif accessible pour les acteurs du secteur culturel.',
    ctaHref: '/demander-devis?service=promo-concert-evenement',
  },
  {
    slug: 'interview-reportage',
    title: 'Interview & reportage',
    tagline: 'Votre histoire, notre audience. Un format professionnel pour vous mettre en avant',
    price: '150 000 FCFA',
    priceNote: 'Format standard — devis sur mesure pour formats longs',
    icon: Mic2,
    image: '/images/offre-sponsorise.jpg',
    category: 'contenu',
    summary: 'Interview ou reportage format court (3–5 min), diffusé sur tous nos réseaux. Idéal pour lancement, personnalité ou success story.',
    why: [
      'Donner une voix à votre projet, votre marque ou votre parcours',
      'Bénéficier d\'un contenu de qualité professionnelle (tournage, montage, diffusion)',
      'Toucher une audience large avec un format engageant et partageable',
      'Renforcer votre crédibilité et votre notoriété auprès des jeunes',
    ],
    howWeDeliver: [
      'Brief et préparation des questions / angles en amont',
      'Tournage sur site (1/2 journée type) ou en studio selon le projet',
      'Montage et post-production selon nos standards éditoriaux',
      'Diffusion sur TikTok, Instagram, Facebook, YouTube avec mentions et liens',
    ],
    deliverables: [
      'Vidéo interview ou reportage (3–5 min) format court',
      'Version courte (60–90 s) pour TikTok, Reels, Shorts',
      'Publication sur tous nos réseaux avec mentions officielles',
      'Possibilité de récupérer les fichiers bruts (option)',
    ],
    idealFor: [
      'Entrepreneurs et fondateurs de startups',
      'Artistes et personnalités en lancement',
      'Marques et institutions avec une histoire à raconter',
      'Événements et initiatives à fort impact',
    ],
    turnaround: 'Diffusion sous 7–10 jours après le tournage',
    priceRationale: 'Un reportage professionnel avec une agence de production audiovisuelle à Abidjan peut coûter 300 000 à 1 000 000 FCFA. Nous proposons un format optimisé pour le digital et une diffusion garantie sur notre audience, à un tarif adapté aux PME et créateurs.',
    ctaHref: '/demander-devis?service=interview-reportage',
  },
  {
    slug: 'partenariat-marque',
    title: 'Partenariat de marque',
    tagline: 'Une présence permanente sur votre audience cible : 2 posts + 2 stories/semaine',
    price: '1 500 000 FCFA / mois',
    priceNote: 'Engagement minimum 3 mois recommandé',
    icon: Handshake,
    image: '/images/offre-partenariat.jpg',
    category: 'partenariat',
    summary: 'Contenu permanent : 2 posts + 2 stories/semaine sur tous nos réseaux. Liens officiels, suivi dédié, stratégie alignée à vos objectifs.',
    why: [
      'Construire une visibilité durable auprès de la jeunesse africaine francophone',
      'Bénéficier d\'un contenu régulier et cohérent sans gérer une équipe interne',
      'Associer votre marque à un média de référence (300 M+ vues cumulées)',
      'Toucher une audience qualifiée et engagée (pas seulement des impressions)',
    ],
    howWeDeliver: [
      'Kick-off : définition des objectifs, ton, KPIs et calendrier éditorial',
      'Production de 2 posts + 2 stories/semaine (contenu mix : produit, lifestyle, actualité)',
      'Diffusion sur TikTok, Instagram, Facebook, YouTube, Threads',
      'Liens officiels, codes promo, mentions dans vos campagnes',
      'Reporting mensuel (vues, engagement, reach) et recommandations',
    ],
    deliverables: [
      '8 posts + 8 stories/mois minimum sur tous nos réseaux',
      'Liens officiels et mentions dans vos campagnes',
      'Reporting mensuel et suivi dédié',
      'Contenu adapté à vos briefs et charte graphique',
    ],
    idealFor: [
      'Marques souhaitant une présence long terme en Afrique francophone',
      'E-commerce et marketplaces ciblant les jeunes',
      'Applications et services tech',
      'Institutions et sponsors d\'événements',
    ],
    turnaround: 'Démarrage sous 2 semaines après signature',
    priceRationale: 'Un partenariat long terme avec un macro-influenceur en Côte d\'Ivoire se situe entre 1 000 000 et 2 000 000 FCFA/mois. Nous offrons une diffusion multi-plateformes, une équipe éditoriale et une stratégie de contenu structurée, à un tarif compétitif pour une startup média en croissance.',
    ctaHref: '/demander-devis?service=partenariat-marque',
  },
]

/** Formules de couverture (sous-offres de couverture médiatique) */
export const couvertureFormules = [
  {
    title: 'Classique',
    price: '150 000 FCFA',
    items: ['Présence sur place', 'Captage ambiance & stories', 'Recap sur tous nos réseaux'],
    image: '/images/video-classique.jpg',
  },
  {
    title: 'Premium',
    price: '300 000 FCFA',
    items: ['Classique + Post TikTok/Instagram/Facebook', 'Moments forts diffusés', 'Publication recap avec mention'],
    image: '/images/video-premium.jpg',
  },
  {
    title: 'Gold',
    price: '600 000 FCFA',
    items: ['Équipe complète Scoop sur place', 'Tapis rouge : styles + interviews personnalités', 'Publication sur tous nos réseaux', 'Vidéo recap de l\'événement'],
    image: '/images/video-gold.jpg',
  },
  {
    title: 'Gold+',
    price: '750 000 FCFA',
    items: ['Pack gold complet', 'Vlog YouTube dédié', 'Contenu exclusif multi-plateformes'],
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
