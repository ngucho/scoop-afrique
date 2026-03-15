/**
 * Modèle de contrat type — SCOOP AFRIQUE
 * Basé sur les statuts (status_entreprise.md) et conventions OHADA
 */

export interface ContractClause {
  title: string
  text: string
}

export interface ContractModel {
  type: 'service' | 'partenariat' | 'nda' | 'autre'
  title: string
  clauses: ContractClause[]
}

/** Modèle contrat de prestation de services */
export const CONTRACT_SERVICE_MODEL: ContractModel = {
  type: 'service',
  title: 'Contrat de prestation de services',
  clauses: [
    {
      title: 'Article 1 — Objet',
      text: 'Le présent contrat a pour objet de définir les conditions dans lesquelles SCOOP AFRIQUE (la « Prestataire ») s\'engage à réaliser les prestations décrites au devis accepté, au profit du Client désigné ci-après.',
    },
    {
      title: 'Article 2 — Prestations',
      text: 'Les prestations, leurs modalités, délais et montants sont définis dans le devis et le cahier des charges annexés au présent contrat.',
    },
    {
      title: 'Article 3 — Prix et modalités de paiement',
      text: 'Le prix total des prestations est fixé conformément au devis. Un acompte de 50% peut être exigé à la commande. Le solde est dû à la livraison. Les paiements s\'effectuent par virement bancaire ou mobile money (Wave, Orange Money).',
    },
    {
      title: 'Article 4 — Délais',
      text: 'Les délais de livraison sont indiqués au devis. Tout retard imputable au Client suspend les délais. La Prestataire ne saurait être tenue responsable des retards dus à des cas de force majeure.',
    },
    {
      title: 'Article 5 — Propriété intellectuelle',
      text: 'Les livrables restent la propriété de la Prestataire jusqu\'au paiement intégral. Après paiement, le Client dispose des droits d\'exploitation convenus. Les éléments préexistants restent la propriété de leurs auteurs.',
    },
    {
      title: 'Article 6 — Résiliation',
      text: 'En cas de manquement grave, la partie lésée peut résilier le contrat après mise en demeure restée sans effet. Les sommes dues restent exigibles.',
    },
    {
      title: 'Article 7 — Droit applicable',
      text: 'Le présent contrat est régi par le droit ivoirien et l\'Acte Uniforme OHADA. Tout litige relève des tribunaux compétents d\'Abidjan.',
    },
  ],
}

/** Modèle contrat de partenariat */
export const CONTRACT_PARTENARIAT_MODEL: ContractModel = {
  type: 'partenariat',
  title: 'Contrat de partenariat',
  clauses: [
    {
      title: 'Article 1 — Objet',
      text: 'Les parties conviennent d\'un partenariat pour la réalisation conjointe de [objet à définir], dans le cadre des activités de SCOOP AFRIQUE.',
    },
    {
      title: 'Article 2 — Engagements réciproques',
      text: 'Chaque partie s\'engage à contribuer selon les modalités définies en annexe. Les apports en nature ou en numéraire sont précisés au devis ou à la convention annexe.',
    },
    {
      title: 'Article 3 — Répartition des bénéfices',
      text: 'La répartition des bénéfices et des charges est fixée conformément aux annexes. Toute modification requiert un avenant signé des deux parties.',
    },
    {
      title: 'Article 4 — Durée',
      text: 'Le partenariat prend effet à la date de signature et court pour une durée de [X] mois, renouvelable par tacite reconduction sauf dénonciation avec préavis de [X] jours.',
    },
    {
      title: 'Article 5 — Confidentialité',
      text: 'Les parties s\'engagent à ne pas divulguer les informations confidentielles échangées dans le cadre du partenariat.',
    },
  ],
}

/** Modèle NDA (Accord de confidentialité) */
export const CONTRACT_NDA_MODEL: ContractModel = {
  type: 'nda',
  title: 'Accord de confidentialité (NDA)',
  clauses: [
    {
      title: 'Article 1 — Définition des informations confidentielles',
      text: 'Sont considérées comme confidentielles toutes les informations, données, documents et savoir-faire échangés entre les parties dans le cadre de [projet/relation commerciale], qu\'ils soient oraux ou écrits.',
    },
    {
      title: 'Article 2 — Obligations',
      text: 'Chaque partie s\'engage à ne pas divulguer, reproduire ou utiliser les informations confidentielles à d\'autres fins que celles prévues, sans accord écrit préalable.',
    },
    {
      title: 'Article 3 — Exclusions',
      text: 'Ne sont pas considérées comme confidentielles les informations déjà publiques, connues antérieurement ou développées indépendamment.',
    },
    {
      title: 'Article 4 — Durée',
      text: 'Les obligations de confidentialité subsistent pendant [X] années après la fin de la relation contractuelle.',
    },
  ],
}

export const CONTRACT_MODELS: Record<string, ContractModel> = {
  service: CONTRACT_SERVICE_MODEL,
  partenariat: CONTRACT_PARTENARIAT_MODEL,
  nda: CONTRACT_NDA_MODEL,
}
