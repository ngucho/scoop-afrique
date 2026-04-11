/**
 * Programmes éditoriaux phares — contenu public orienté sponsors & partenaires
 * (aligné sur le catalogue éditorial2026 et le media kit).
 */

export interface EditorialProgram {
  slug: string
  title: string
  tagline: string
  pillar: string
  /** Résumé pour cartes hub */
  cardSummary: string
  whatItIs: string
  /** Pourquoi ça intéresse une marque */
  sponsorValue: string[]
  /** Fréquence / rythme indicatif */
  cadence: string
  platforms: string[]
  formats: { name: string; description: string }[]
  idealSponsors: string[]
  integrationExamples: string[]
  /** Transparence éditoriale */
  editorialNote: string
}

export const editorialPrograms: EditorialProgram[] = [
  {
    slug: 'scoop-game',
    title: 'Scoop Game',
    tagline: 'Jeux et défis avec les personnalités qui font l’Afrique',
    pillar: 'Culture & divertissement',
    cardSummary:
      'Format studio hebdomadaire : défis, vérités et moments viraux avec artistes, entrepreneurs et sportifs — idéal pour intégrations produit naturelles.',
    whatItIs:
      'Scoop Game est une série où chaque invité relève des jeux courts filmés en studio. Chaque épisode produit une version longue (YouTube) et plusieurs extraits verticaux optimisés pour TikTok, Instagram et Shorts.',
    sponsorValue: [
      'Associer votre marque à des moments d’émotion et d’humour très partagés',
      'Présence possible dans les défis, accessoires, boissons ou récompenses — sans casser le ton éditorial',
      'Fréquence hebdomadaire : une habitude de rendez-vous pour l’audience',
      'Découpage multi-clips : plusieurs points de contact pour une même activation',
    ],
    cadence: 'Viser 1 épisode par semaine (créneau type : jeudi soir).',
    platforms: ['YouTube (format long)', 'TikTok', 'Instagram Reels', 'YouTube Shorts', 'Facebook'],
    formats: [
      { name: 'Épisode signature', description: '8–12 min sur YouTube, habillage et jingle identifiables.' },
      { name: 'Extraits viraux', description: '5 à 8 coupes de 30–60 s pour les flux courts.' },
      { name: 'Teasing cross-réseaux', description: 'Annonce 48 h avant pour maximiser la mise en avant partenaire.' },
    ],
    idealSponsors: [
      'Marques lifestyle, télécoms, boissons, snack, jeux & loisirs',
      'Labels et promoteurs qui veulent lier une sortie à un format récurrent',
      'Plateformes streaming ou événements culturels cherchant la notoriété jeune',
    ],
    integrationExamples: [
      '« Défi présenté par [marque] » en ouverture d’épisode',
      'Produit utilisé comme accessoire de jeu (sans script publicitaire lourd)',
      'Série spéciale (CAN, fêtes, rentrée) co-brandée',
    ],
    editorialNote:
      'Tout message commercial est validé avec la rédaction et signalé clairement au public lorsque la loi ou les bonnes pratiques l’exigent. Nous refusons les intégrations qui contredisent notre ligne éditoriale.',
  },
  {
    slug: 'canape-sans-filtre',
    title: 'Le Canapé sans filtre',
    tagline: 'L’interview longue qui laisse la place aux confessions et aux silences',
    pillar: 'Culture & société',
    cardSummary:
      'Notre émission phare en format long : un canapé, une conversation profonde, des extraits très partageables pour les réseaux.',
    whatItIs:
      'Installés dans un décor aux couleurs Scoop Afrique, l’invité parle de son parcours, de ses choix et de ses projets. Le montage privilégie l’authenticité ; la version courte capte les phrases les plus fortes.',
    sponsorValue: [
      'Aligner votre marque sur la profondeur et la crédibilité (premium brand safety)',
      'Visibilité sur YouTube + relais courts sur TikTok / Instagram / Facebook',
      'Possibilité de thématiques ou de saisons (« Génération Afrique », « Bâtisseurs », etc.)',
      'Bibliothèque d’épisodes : contenu evergreen consultable pendant des mois',
    ],
    cadence: 'Viser 1 épisode par semaine (créneau type : mardi soir).',
    platforms: ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Shorts'],
    formats: [
      { name: 'Grand entretien', description: '20–40 min, rythme soutenu, chapitrage clair.' },
      { name: 'Moments forts', description: '4 à 6 extraits courts pour alimenter les flux du quotidien.' },
      { name: 'Article & SEO', description: 'Retranscription ou résumé sur scoop-afrique.com pour prolonger la portée.' },
    ],
    idealSponsors: [
      'Marques premium, banques, automobiles, spiritueux (avec modération)',
      'Institutions et fondations qui sponsorisent des portraits d’entrepreneurs ou d’artistes',
      'Services B2B qui veulent toucher les 25–45 ans informés',
    ],
    integrationExamples: [
      'Naming de saison : « Le Canapé sans filtre, avec le soutien de [marque] »',
      'Épisode consacré à une thématique portée par le partenaire (ex. entrepreneuriat féminin)',
      'Présence discrète dans le décor (canapé, coussins, boisson servie)',
    ],
    editorialNote:
      'Le contenu reste conduit par la rédaction. Aucune question imposée par un annonceur ne peut compromettre l’indépendance du média.',
  },
  {
    slug: 'get-ready-with-scoop',
    title: 'Get Ready With Scoop',
    tagline: 'Les coulisses glam’ avant le grand saut sur scène',
    pillar: 'Culture & événements',
    cardSummary:
      'On suit une personnalité dans les dernières heures avant concert, tapis rouge ou lancement — contenu intime, très fort pour mode & beauté.',
    whatItIs:
      'La caméra capture préparation, équipe, stress et excitation. Le montage mélange vlog premium et moments spontanés ; les extraits verticaux prolongent la vie du partenariat après l’événement.',
    sponsorValue: [
      'Placement naturel pour marques beauté, mode, accessoires, horlogerie',
      'Attachement émotionnel fort : l’audience « vit » le moment avec l’artiste ou l’invité',
      'Calendrier lié aux grands rendez-vous culturels (cérémonies, Fashion Week, festivals)',
    ],
    cadence: 'En moyenne 2 épisodes par mois, selon le calendrier événementiel.',
    platforms: ['YouTube', 'TikTok', 'Instagram Reels'],
    formats: [
      { name: 'Vlog long', description: '8–15 min, narration musicale et sous-titres soignés.' },
      { name: 'Shorts & stories', description: 'Série de coupes pour le jour J et le lendemain.' },
      { name: 'Carrousels photo', description: 'Avant / après, coulisses, détail des pièces ou produits.' },
    ],
    idealSponsors: [
      'Marques cosmétiques et parfums',
      'Prêt-à-porter et créateurs africains',
      'Organisateurs de concerts et cérémonies',
    ],
    integrationExamples: [
      'Partenaire officiel « beauty » de la série',
      'Mise en avant d’une tenue ou d’une collection dans le récit',
      'Co-organisation autour d’un événement (aftermovie + GRWS)',
    ],
    editorialNote:
      'Les choix vestimentaires et produits restent validés avec l’invité et son équipe ; nous indiquons les collaborations rémunérées lorsque nécessaire.',
  },
  {
    slug: 'la-rue-repond',
    title: 'La rue répond',
    tagline: 'Le micro-trottoir qui fait débattre toute l’Afrique francophone',
    pillar: 'Société & opinion',
    cardSummary:
      'Questions courtes, réponses vives, opinions contrastées — format léger, très viral, parfait pour ancrer une marque dans le quotidien.',
    whatItIs:
      'Sur un marché, un campus ou une place publique, nous posons une même question à plusieurs personnes. Le montage met en tension les réponses ; l’appel au commentaire prolonge la portée organique.',
    sponsorValue: [
      'Fréquence élevée : habitude de consommation pour l’audience',
      'Associer votre marque à la voix « du terrain » et à la diversité des opinions',
      'Possibilité de thématiser une question en lien avec une campagne (sans détourner le débat)',
    ],
    cadence: 'En général 2 sorties par semaine.',
    platforms: ['TikTok', 'Instagram Reels', 'Facebook', 'YouTube Shorts'],
    formats: [
      { name: 'Micro-trottoir standard', description: '60–120 s, rythme rapide, sous-titres complets.' },
      { name: 'Série thématique', description: '4 vagues sur un sujet pour un partenaire institutionnel ou culturel.' },
    ],
    idealSponsors: [
      'Marques grand public et télécoms',
      'Campagnes de sensibilisation (santé, civisme, éducation financière)',
      'Événements sportifs ou musicaux qui veulent tester les attentes du public',
    ],
    integrationExamples: [
      '« La rue répond, avec [marque] » sur un sujet validé ensemble',
      'Financement d’une tournée dans plusieurs villes (Abidjan, Dakar, Douala…)',
    ],
    editorialNote:
      'Nous ne fabriquons pas de faux avis et ne orientons pas les réponses. La question est conçue pour rester honnête et respectueuse.',
  },
  {
    slug: 'scoop-terrain-impact',
    title: 'Terrain, reportages & décryptage',
    tagline: 'L’Afrique en vrai : reportages, immersion et actu expliquée',
    pillar: 'Société, économie & citoyenneté',
    cardSummary:
      'Scoop Reportage, Scoop Inside et L’actu expliquée : comprendre l’Afrique en images et en deux minutes chrono.',
    whatItIs:
      'Nous allons sur le terrain pour raconter une histoire avec des protagonistes réels ; nous plongeons dans les événements pour donner la sensation d’y être ; nous décryptons l’actualité en formats courts et pédagogiques.',
    sponsorValue: [
      'Cadre sérieux pour ONG, institutions, entreprises avec RSE et tech',
      'Formats courts pour la masse + formats longs pour la crédibilité',
      'Excellent relais sur le site scoop-afrique.com (SEO, newsletter)',
    ],
    cadence:
      'Reportages longs : viser 2 par mois. Actu expliquée : jusqu’à 3 par semaine. Scoop Inside : à la demande selon l’agenda événementiel.',
    platforms: ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'LinkedIn (extraits pro)', 'Site web'],
    formats: [
      { name: 'Reportage documentaire', description: '8–12 min, voix et images de terrain.' },
      { name: 'Scoop Inside', description: 'Immersion 1–4 min, publiée idéalement sous 24 h après l’événement.' },
      { name: 'L’actu expliquée', description: '90 s à 3 min pour rendre une idée ou un chiffre compréhensible.' },
    ],
    idealSponsors: [
      'Fondations, ONG, programmes internationaux',
      'Banques, fintech, incubateurs',
      'Marques tech et énergie qui veulent expliquer leur impact',
    ],
    integrationExamples: [
      'Sponsor de rubrique « Actu expliquée » sur une thématique (économie, climat, jeunesse)',
      'Financement d’un reportage avec mention en ouverture et dans la description',
      'Scoop Inside commandé par l’organisateur d’un salon ou forum',
    ],
    editorialNote:
      'Les sujets sont choisis par la rédaction. Un partenaire peut proposer une thématique ; la validation finale garantit l’intérêt public et l’équilibre des points de vue.',
  },
  {
    slug: 'batisseurs-afrique',
    title: 'Bâtisseurs d’Afrique',
    tagline: 'Portraits des entrepreneurs et innovateurs qui changent le continent',
    pillar: 'Économie & innovation',
    cardSummary:
      'L’invité de Scoop et Scoop Focus : interviews pro, extraits LinkedIn/TikTok, esthétique cinéma pour les success stories.',
    whatItIs:
      'Nous donnons la parole aux fondateurs, dirigeants et porteurs de projets. La version courte extrait l’insight le plus fort ; la version longue développe le parcours. Scoop Focus pousse le portrait visuel pour un rendu premium.',
    sponsorValue: [
      'Toucher une audience pro et la diaspora intéressée par l’investissement en Afrique',
      'Alignement avec l’innovation, le mérite et l’ambition — valeurs fortes pour le B2B',
      'Possibilité de série thématique (femmes dirigeantes, agritech, creative economy)',
    ],
    cadence:
      'Viser 1 grand entretien par semaine pour « L’invité de Scoop » ; 2 portraits Scoop Focus par mois.',
    platforms: ['YouTube', 'TikTok', 'Instagram', 'LinkedIn', 'Site web'],
    formats: [
      { name: 'Interview pro', description: '10–15 min sur YouTube + déclinaison 60–90 s.' },
      { name: 'Scoop Focus', description: 'Portrait90 s à 3 min, esthétique documentaire.' },
      { name: 'Article récap', description: 'Synthèse sur scoop-afrique.com pour le référencement.' },
    ],
    idealSponsors: [
      'Banques, assureurs, cabinets de conseil',
      'Incubateurs, fonds d’investissement, corporate venture',
      'Marques tech B2B et éducation',
    ],
    integrationExamples: [
      'Série « Bâtisseurs » présentée par un partenaire institutionnel',
      'Scoop Focus sur un ambassadeur de marque déjà en relation avec vous',
      'Tables rondes ou live LinkedIn dérivés des entretiens',
    ],
    editorialNote:
      'Les invités sont sélectionnés pour l’intérêt de leur histoire ; aucun passage payant ne remplace le critère éditorial.',
  },
]

const bySlug = new Map(editorialPrograms.map((p) => [p.slug, p]))

export function getProgramBySlug(slug: string): EditorialProgram | undefined {
  return bySlug.get(slug)
}

export function getAllProgramSlugs(): string[] {
  return editorialPrograms.map((p) => p.slug)
}
