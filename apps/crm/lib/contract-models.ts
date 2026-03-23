/**
 * Modèles de contrats type — SCOOP AFRIQUE
 * Alignés sur templates/js/contrats_pro.js (références SA-PREST … SA-APPORT).
 * Le JSON des clauses reste éditable dans le formulaire pour avenants / interlocuteurs particuliers.
 */

export interface ContractClause {
  title: string
  text: string
}

export interface ContractModel {
  /** Clé stockée en base (string libre côté API ; ces clés correspondent aux templates pro) */
  type: string
  /** Référence documentaire type contrats_pro (ex. SA-PREST) */
  templateRef: string
  title: string
  clauses: ContractClause[]
}

export const CONTRACT_PREST_MODEL: ContractModel = {
  type: 'prest',
  templateRef: 'SA-PREST',
  title: 'Contrat de prestation de services',
  clauses: [
    {
      title: 'Article 1 — Objet',
      text: "Le présent contrat a pour objet de définir les conditions dans lesquelles SCOOP AFRIQUE (la « Prestataire ») réalise les prestations décrites au devis accepté : couverture événementielle, interview, publication ou reportage, au profit du Client.",
    },
    {
      title: 'Article 2 — Prestations et livrables',
      text: 'Les prestations, délais, formats et montants sont définis dans le devis et le cahier des charges annexés. Toute prestation supplémentaire fait l’objet d’un devis complémentaire ou d’un avenant.',
    },
    {
      title: 'Article 3 — Prix et paiement',
      text: "Le prix est fixé conformément au devis. Un acompte peut être exigé à la commande ; le solde est dû selon les échéances convenues. Paiements par virement ou mobile money (Wave, Orange Money, etc.).",
    },
    {
      title: 'Article 4 — Ligne éditoriale',
      text: "Scoop Afrique conserve la maîtrise exclusive de son ton éditorial, de ses angles et de sa ligne de communication. Le Client ne peut exiger de modifications portant sur le style ou le ton ; seules les erreurs factuelles vérifiables peuvent donner lieu à correction.",
    },
    {
      title: 'Article 5 — Propriété intellectuelle',
      text: "Les livrables restent la propriété de la Prestataire jusqu’au paiement intégral. Après paiement, les droits d’exploitation convenus dans le devis s’appliquent. Les éléments préexistants restent la propriété de leurs auteurs.",
    },
    {
      title: 'Article 6 — Délais et force majeure',
      text: "Les délais sont ceux du devis. Tout retard imputable au Client suspend les délais. Sont exclus les cas de force majeure au sens du droit ivoirien et de l’OHADA.",
    },
    {
      title: 'Article 7 — Résiliation et droit applicable',
      text: "En cas de manquement grave, résiliation après mise en demeure. Le présent contrat est régi par le droit ivoirien et l’Acte Uniforme OHADA. Litiges : tribunaux compétents d’Abidjan.",
    },
  ],
}

export const CONTRACT_BRAND_MODEL: ContractModel = {
  type: 'brand',
  templateRef: 'SA-BRAND',
  title: 'Contrat de partenariat de marque (brand deal)',
  clauses: [
    {
      title: 'Article 1 — Objet',
      text: "Partenariat pour la production et la diffusion de contenus sponsorisés ou récurrents (abonnement mensuel, séries, opérations de marque) entre SCOOP AFRIQUE et la Marque.",
    },
    {
      title: 'Article 2 — Engagements',
      text: "Les volumes, formats, calendrier, mentions légales « partenariat rémunéré » et livrables sont précisés en annexe ou bon de commande. La Marque fournit les éléments de marque dans les délais utiles.",
    },
    {
      title: 'Article 3 — Rémunération',
      text: "Rémunération forfaitaire et/ou récurrente selon l’offre acceptée. Facturation et délais de paiement conformément aux conditions commerciales convenues.",
    },
    {
      title: 'Article 4 — Créativité et conformité',
      text: "Scoop Afrique demeure responsable de la forme éditoriale sous réserve du respect des guidelines de marque fournies. Contenus conformes au droit de la publicité et aux usages des plateformes.",
    },
    {
      title: 'Article 5 — Durée et résiliation',
      text: "Durée et reconduction définies en annexe. Résiliation pour manquement grave selon les modalités prévues, avec régularisation des prestations déjà réalisées.",
    },
    {
      title: 'Article 6 — Confidentialité et droit applicable',
      text: "Les informations échangées peuvent être couvertes par une clause de confidentialité. Droit ivoirien et OHADA ; tribunaux d’Abidjan.",
    },
  ],
}

export const CONTRACT_COPROD_MODEL: ContractModel = {
  type: 'coprod',
  templateRef: 'SA-COPROD',
  title: 'Accord de coproduction créative',
  clauses: [
    {
      title: 'Article 1 — Objet',
      text: "Accord entre SCOOP AFRIQUE et le(s) co-producteur(s) pour la conception, la production et la exploitation conjointe d’un ou plusieurs contenus audiovisuels ou multimédias.",
    },
    {
      title: 'Article 2 — Apports et rôles',
      text: "Les apports respectifs (moyens humains, techniques, financiers, accès, droits) et la répartition des tâches sont définis en annexe.",
    },
    {
      title: 'Article 3 — Propriété et exploitation',
      text: "La répartition des droits d’auteur, droits voisins et droits d’exploitation (territoires, durées, supports) est fixée en annexe. Toute cession à un tiers requiert l’accord écrit des coproducteurs sauf clause contraire.",
    },
    {
      title: 'Article 4 — Budget et recettes',
      text: "Le budget, les dépenses communes et le partage des recettes éventuelles sont précisés en annexe.",
    },
    {
      title: 'Article 5 — Crédits et mention',
      text: "Les crédits et mentions de coproduction sur les œuvres et supports promotionnels sont définis en annexe.",
    },
    {
      title: 'Article 6 — Droit applicable',
      text: "Droit ivoirien et OHADA ; litiges devant les tribunaux compétents d’Abidjan.",
    },
  ],
}

export const CONTRACT_SPONS_MODEL: ContractModel = {
  type: 'spons',
  templateRef: 'SA-SPONS',
  title: 'Contrat de sponsoring événementiel',
  clauses: [
    {
      title: 'Article 1 — Objet',
      text: "Mise en visibilité et contreparties associées au sponsoring d’un événement (concert, festival, cérémonie, lancement, promotion artiste) par le Sponsor au profit de l’événement et/ou de Scoop Afrique selon le dossier de sponsoring.",
    },
    {
      title: 'Article 2 — Packages et contreparties',
      text: "Les niveaux de sponsoring, logos, placements, tickets, zones, contenus et livrables sont décrits dans la proposition commerciale acceptée.",
    },
    {
      title: 'Article 3 — Contrepartie financière',
      text: "Montant, échéancier et modalités de paiement conformément à la proposition acceptée. Facturation selon la législation applicable.",
    },
    {
      title: 'Article 4 — Image et responsabilité',
      text: "Le Sponsor garantit disposer des droits sur ses signes distinctifs. Scoop Afrique / l’organisateur s’engagent sur la tenue de l’événement dans les termes annoncés, sous réserve de force majeure.",
    },
    {
      title: 'Article 5 — Annulation',
      text: "Modalités de report ou remboursement partiel en cas d’annulation ou report majeur de l’événement, selon les termes de l’offre.",
    },
    {
      title: 'Article 6 — Droit applicable',
      text: "Droit ivoirien et OHADA ; tribunaux d’Abidjan.",
    },
  ],
}

export const CONTRACT_STAGE_MODEL: ContractModel = {
  type: 'stage',
  templateRef: 'SA-STAGE',
  title: 'Convention de stage',
  clauses: [
    {
      title: 'Article 1 — Parties et cadre légal',
      text: "Convention de stage entre l’organisme d’accueil Scoop Afrique, l’établissement d’enseignement et le stagiaire, conformément au Code du travail ivoirien et textes applicables aux stages.",
    },
    {
      title: 'Article 2 — Mission',
      text: "La mission du stagiaire, encadrement, durée, horaires et lieu sont définis en annexe. Aucune substitution à un emploi salarié.",
    },
    {
      title: 'Article 3 — Gratification et avantages',
      text: "Gratification et frais éventuels conformément à la réglementation en vigueur et à la convention tripartite.",
    },
    {
      title: 'Article 4 — Assurance et santé',
      text: "Les obligations d’assurance (établissement / organisme) et les règles de sécurité sont rappelées en annexe.",
    },
    {
      title: 'Article 5 — Confidentialité',
      text: "Le stagiaire s’engage à respecter la confidentialité des informations et contenus auxquels il a accès.",
    },
    {
      title: 'Article 6 — Fin de stage',
      text: "Attestation et évaluation selon les usages de l’établissement. Résiliation anticipée selon les motifs prévus par la convention type.",
    },
  ],
}

export const CONTRACT_FREE_MODEL: ContractModel = {
  type: 'free',
  templateRef: 'SA-FREE',
  title: 'Contrat de prestation freelance',
  clauses: [
    {
      title: 'Article 1 — Qualité des parties',
      text: "Le Prestataire freelance agit en qualité d’entrepreneur indépendant (monteur, photographe, journaliste, graphiste, développeur, etc.). Aucun lien de subordination n’est créé avec Scoop Afrique.",
    },
    {
      title: 'Article 2 — Prestations',
      text: "Les missions, livrables, délais et tarifs sont définis par bon de commande ou devis accepté.",
    },
    {
      title: 'Article 3 — Facturation et paiement',
      text: "Facturation par le Prestataire ; paiement selon délais convenus. Le Prestataire déclare être à jour de ses obligations fiscales et sociales.",
    },
    {
      title: 'Article 4 — Propriété intellectuelle',
      text: "Cession ou licence des droits sur les livrables selon les termes du bon de commande ; droits moraux dans les limites admises par la loi.",
    },
    {
      title: 'Article 5 — Confidentialité',
      text: "Obligation de confidentialité sur les informations et rushs auxquels le Prestataire a accès.",
    },
    {
      title: 'Article 6 — Responsabilité et droit applicable',
      text: "Responsabilité du Prestataire sur l’exécution de sa mission. Droit ivoirien et OHADA ; tribunaux d’Abidjan.",
    },
  ],
}

export const CONTRACT_NDA_MODEL: ContractModel = {
  type: 'nda',
  templateRef: 'SA-NDA',
  title: 'Accord de confidentialité (NDA)',
  clauses: [
    {
      title: 'Article 1 — Informations confidentielles',
      text: "Sont confidentielles les informations échangées dans le cadre du projet ou de la relation commerciale (écrites, orales, techniques, financières, éditoriales).",
    },
    {
      title: 'Article 2 — Obligations',
      text: "Ne pas divulguer, reproduire ou utiliser les informations confidentielles hors des fins prévues, sans accord écrit préalable.",
    },
    {
      title: 'Article 3 — Exclusions',
      text: "Informations déjà publiques, connues avant divulgation ou développées indépendamment.",
    },
    {
      title: 'Article 4 — Durée',
      text: "Les obligations de confidentialité subsistent pendant la relation et [X] années après sa fin.",
    },
    {
      title: 'Article 5 — Droit applicable',
      text: "Droit ivoirien et OHADA ; tribunaux d’Abidjan.",
    },
  ],
}

export const CONTRACT_APPORT_MODEL: ContractModel = {
  type: 'apport',
  templateRef: 'SA-APPORT',
  title: "Contrat d'apport d'affaires",
  clauses: [
    {
      title: 'Article 1 — Objet',
      text: "L’Apporteur met en relation Scoop Afrique avec des prospects ; rémunération à la commission sur affaires conclues, selon les taux et conditions définis en annexe.",
    },
    {
      title: 'Article 2 — Indépendance',
      text: "L’Apporteur n’est pas mandataire de Scoop Afrique pour engager la société. Aucune avance de commission sauf stipulation écrite contraire.",
    },
    {
      title: 'Article 3 — Anti-corruption et conflits',
      text: "Interdiction de verser ou recevoir des avantages indus. Déclaration des conflits d’intérêts potentiels.",
    },
    {
      title: 'Article 4 — Calcul de la commission',
      text: "Commission due sur le montant HT facturé et encaissé pour les contrats effectivement signés et issus de l’apport identifié, selon la grille annexée.",
    },
    {
      title: 'Article 5 — Confidentialité',
      text: "Les négociations et conditions commerciales restent confidentielles.",
    },
    {
      title: 'Article 6 — Droit applicable',
      text: "Droit ivoirien et OHADA ; tribunaux d’Abidjan.",
    },
  ],
}

/** Ancien modèle « partenariat » générique — conservé pour compatibilité. */
export const CONTRACT_PARTENARIAT_MODEL: ContractModel = {
  type: 'partenariat',
  templateRef: 'SA-PARTENARIAT-LEGACY',
  title: 'Contrat de partenariat',
  clauses: [
    {
      title: 'Article 1 — Objet',
      text: "Les parties conviennent d’un partenariat pour la réalisation conjointe de l’objet défini en annexe, dans le cadre des activités de SCOOP AFRIQUE.",
    },
    {
      title: 'Article 2 — Engagements réciproques',
      text: "Chaque partie contribue selon les modalités définies en annexe (apports, moyens, délais).",
    },
    {
      title: 'Article 3 — Répartition',
      text: "Répartition des bénéfices, charges et risques selon l’annexe. Avenant requis pour toute modification substantielle.",
    },
    {
      title: 'Article 4 — Durée',
      text: "Durée et résiliation précisées en annexe.",
    },
    {
      title: 'Article 5 — Confidentialité',
      text: "Les parties s’engagent à ne pas divulguer les informations confidentielles échangées.",
    },
    {
      title: 'Article 6 — Droit applicable',
      text: "Droit ivoirien et OHADA ; tribunaux d’Abidjan.",
    },
  ],
}

/** Modèles chargeables depuis le formulaire (clé → modèle). */
export const CONTRACT_MODELS: Record<string, ContractModel> = {
  prest: CONTRACT_PREST_MODEL,
  brand: CONTRACT_BRAND_MODEL,
  coprod: CONTRACT_COPROD_MODEL,
  spons: CONTRACT_SPONS_MODEL,
  stage: CONTRACT_STAGE_MODEL,
  free: CONTRACT_FREE_MODEL,
  nda: CONTRACT_NDA_MODEL,
  apport: CONTRACT_APPORT_MODEL,
  /** Alias historique CRM */
  service: CONTRACT_PREST_MODEL,
  partenariat: CONTRACT_PARTENARIAT_MODEL,
}

/** Options du sélecteur (ordre = catalogue contrats_pro.js). */
export const CONTRACT_TYPE_SELECT_OPTIONS: { value: string; label: string; ref: string }[] = [
  { value: 'prest', label: '01 — Prestation de services', ref: 'SA-PREST' },
  { value: 'brand', label: '02 — Partenariat de marque / Brand deal', ref: 'SA-BRAND' },
  { value: 'coprod', label: '03 — Coproduction créative', ref: 'SA-COPROD' },
  { value: 'spons', label: '04 — Sponsoring événementiel', ref: 'SA-SPONS' },
  { value: 'stage', label: '05 — Convention de stage', ref: 'SA-STAGE' },
  { value: 'free', label: '06 — Prestation freelance', ref: 'SA-FREE' },
  { value: 'nda', label: '07 — NDA / Confidentialité', ref: 'SA-NDA' },
  { value: 'apport', label: "08 — Apporteur d'affaires", ref: 'SA-APPORT' },
  { value: 'partenariat', label: 'Partenariat (modèle générique)', ref: 'legacy' },
  { value: 'autre', label: 'Autre / sur mesure', ref: '—' },
]
