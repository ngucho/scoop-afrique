# Cycle de clôture et d’archivage des dossiers projet CRM

Date : 2026-07-28
Statut : conception et spécification validées par le produit

## 1. Contexte

L’archivage actuel d’un projet ne modifie que
`crm_projects.is_archived`. Les devis, factures, contrats, relances,
tâches, livrables, dépenses, paiements et mouvements associés ne sont pas
traités ensemble.

Une suppression SQL n’est pas une alternative acceptable :

- les tâches, livrables, métriques, dépenses et relations projet seraient
  supprimés en cascade ;
- les devis, factures, contrats, relances et mouvements de trésorerie seraient
  conservés, mais détachés du projet par `project_id = NULL` ;
- les paiements et reçus resteraient rattachés aux factures ;
- le dossier commercial perdrait sa cohérence et sa traçabilité.

Le CRM doit donc traiter le projet comme la racine d’un dossier commercial et
appliquer une clôture transactionnelle, auditable et sans suppression des
pièces historiques.

## 2. Références comptables et fiscales

La Côte d’Ivoire utilise l’AUDCIF et le SYSCOHADA comme référentiel comptable.
La plateforme officielle de Facture Normalisée Électronique conserve
l’historique des factures émises et prévoit la facture d’avoir, produite à
partir de la facture de vente originale.

Références :

- OHADA, droit comptable :
  https://www.ohada.org/le-droit-comptable-ohada/
- DGI Côte d’Ivoire, guide d’utilisation FNE, notamment les pages 26 à 36 :
  https://www.fne.dgi.gouv.ci/documents/FNE-Guide%20utilisateur.pdf

Le CRM ne remplace pas la validation d’un expert-comptable. Il doit toutefois
préserver les pièces originales, distinguer un avoir d’une créance abandonnée
et empêcher une suppression silencieuse de données financières.

## 3. Objectifs

Le lot doit :

1. remplacer l’archivage isolé du projet par une clôture de dossier ;
2. imposer la résolution de chaque facture ouverte avant l’archivage ;
3. figer toutes les mutations opérationnelles et financières après archivage ;
4. préserver les documents, paiements, reçus, dépenses et mouvements
   historiques ;
5. annuler les relances futures et les tâches encore ouvertes ;
6. fournir un aperçu d’impact avant confirmation ;
7. exécuter tous les effets dans une seule transaction SQL ;
8. produire une piste d’audit complète ;
9. régulariser manuellement les archives historiques incohérentes ;
10. maintenir des rapports financiers cohérents.

## 4. Non-objectifs

Ce lot ne doit pas :

- exposer une suppression SQL définitive de projet ;
- supprimer une facture, un paiement, un reçu, une dépense, un justificatif ou
  un mouvement de trésorerie ;
- intégrer directement l’API FNE ;
- automatiser la décision comptable qu’une créance est juridiquement
  irrécouvrable ;
- modifier silencieusement les projets déjà archivés ;
- permettre la restauration d’un dossier dont les pièces financières ont été
  régularisées par un avoir ou un abandon de créance ;
- refondre l’ensemble des rapports ou de la comptabilité du CRM.

## 5. Terminologie

### 5.1 Clôture

Décision métier qui met fin à l’exécution du projet. Une clôture possède un
type, un motif, un auteur et une date.

Types de clôture :

- `completed` : projet terminé normalement ;
- `client_abandoned` : abandon ou refus de poursuivre par le client ;
- `mutual_termination` : résiliation convenue entre les parties ;
- `company_cancelled` : annulation décidée par Scoop Afrique.

### 5.2 Archivage

Conséquence technique de la clôture. Le dossier quitte les vues
opérationnelles et devient en lecture seule.

### 5.3 Avoir

Réduction totale ou partielle d’une facture correspondant notamment à une
prestation non réalisée ou à une remise commerciale. L’avoir est lié à la
facture originale, qui reste conservée.

### 5.4 Créance abandonnée

Montant facturé pour un travail réalisé mais que l’entreprise décide de ne plus
recouvrer. La facture originale n’est ni supprimée ni réduite. Le CRM conserve
séparément le montant, le motif et les justificatifs de la décision.

Cette qualification interne ne vaut pas automatiquement reconnaissance fiscale
d’une créance irrécouvrable.

## 6. Invariants

Les règles suivantes ne doivent avoir aucune exception :

1. Une pièce émise ne peut jamais être supprimée par la clôture d’un projet.
2. Un paiement ou reçu existant ne peut jamais être modifié par la clôture.
3. Un projet archivé ne peut recevoir aucune nouvelle mutation.
4. Une facture liée à un projet archivé ne peut recevoir aucun paiement,
   ajustement ou changement de statut supplémentaire.
5. Une dépense ou un mouvement de trésorerie lié à un projet archivé ne peut
   plus être créé, modifié ou supprimé.
6. Toute facture ouverte doit recevoir une résolution explicite avant la
   clôture.
7. L’aperçu et la transaction finale doivent porter sur le même état du
   dossier.
8. Une erreur annule l’ensemble de la clôture.
9. Les rapports de trésorerie conservent les flux réellement survenus.
10. Les vues opérationnelles excluent les dossiers archivés.
11. Une restauration ne peut pas réécrire l’histoire d’un avoir ou d’un abandon
    de créance.

## 7. Architecture choisie

La logique est centralisée dans un service de cycle de vie :

```text
project-closure.service
  ├─ buildClosurePreview(projectId)
  ├─ validateClosureRequest(projectId, request)
  ├─ closeAndArchiveProject(projectId, request, actor)
  ├─ assertProjectWritable(projectId)
  └─ restoreProjectArchive(projectId, actor)
```

Les routes et services CRM ne dupliquent pas la politique. Ils appellent une
garde commune avant toute mutation d’une entité liée à un projet.

L’opération de clôture utilise une transaction PostgreSQL et verrouille le
projet avec `SELECT ... FOR UPDATE`.

## 8. Modèle de données

### 8.1 Métadonnées d’archivage

Les tables `crm_projects`, `crm_devis`, `crm_invoices` et `crm_contracts`
conservent `is_archived` pour compatibilité et reçoivent :

- `archived_at TIMESTAMPTZ NULL` ;
- `archived_by UUID NULL` ;
- `archive_reason TEXT NULL` ;
- `archive_operation_id UUID NULL`.

Pour les projets :

- `predecessor_project_id UUID NULL`, auto-référence avec `ON DELETE RESTRICT` ;
- `closure_type` avec les quatre valeurs définies plus haut ;
- `closure_reason TEXT` ;
- `closed_by UUID` ;
- `closure_version INTEGER NOT NULL DEFAULT 0`.

`closure_version` change lors de toute mutation du projet. L’empreinte complète
de l’aperçu couvre aussi les entités enfant et détecte leurs changements.

### 8.2 Opérations de clôture

Nouvelle table `crm_project_closure_operations` :

- `id UUID PRIMARY KEY` ;
- `project_id UUID NOT NULL` ;
- `idempotency_key UUID NOT NULL UNIQUE` ;
- `request_hash TEXT NOT NULL` ;
- `closure_type` ;
- `reason TEXT NOT NULL` ;
- `preview_fingerprint TEXT NOT NULL` ;
- `status` : `completed` ou `reversed` ;
- `summary JSONB NOT NULL` ;
- `created_by UUID` ;
- `created_at TIMESTAMPTZ` ;
- `reversed_by UUID NULL` ;
- `reversed_at TIMESTAMPTZ NULL`.

La table conserve le résumé figé du dossier au moment de la décision.

### 8.3 Effets de la clôture

Nouvelle table `crm_project_closure_items` :

- `id UUID PRIMARY KEY` ;
- `operation_id UUID NOT NULL` ;
- `entity_type TEXT NOT NULL` ;
- `entity_id UUID NOT NULL` ;
- `action TEXT NOT NULL` ;
- `previous_state JSONB` ;
- `result_state JSONB` ;
- `created_at TIMESTAMPTZ`.

Elle permet de savoir exactement quels éléments ont été archivés, annulés,
conservés ou régularisés.

### 8.4 Ajustements financiers

Nouvelle table `crm_invoice_adjustments` :

- `id UUID PRIMARY KEY` ;
- `invoice_id UUID NOT NULL` ;
- `project_id UUID NOT NULL` ;
- `closure_operation_id UUID NOT NULL` ;
- `type` : `credit_note` ou `bad_debt` ;
- `amount INTEGER NOT NULL CHECK (amount > 0)` ;
- `currency TEXT NOT NULL` ;
- `reason TEXT NOT NULL` ;
- `external_reference TEXT NULL` ;
- `evidence_url TEXT NULL` ;
- `manager_attestation BOOLEAN NOT NULL DEFAULT false` ;
- `effective_at TIMESTAMPTZ NOT NULL` ;
- `created_by UUID` ;
- `created_at TIMESTAMPTZ`.

Pour une facture émise, un avoir doit comporter la référence du document FNE
ou comptable correspondant avant la clôture. L’intégration FNE elle-même reste
hors de ce lot.

Une même facture peut recevoir plusieurs ajustements si une partie du solde
correspond à des prestations non réalisées et une autre partie à une créance
abandonnée. La somme des ajustements de clôture doit couvrir exactement le
solde restant de la facture.

La facture reçoit également :

- `closure_resolution` : `paid`, `credit_note`, `bad_debt` ou `mixed` ;
- `closure_resolved_at TIMESTAMPTZ NULL` ;
- `closure_resolved_by UUID NULL`.

Le total original, le montant payé et les lignes originales ne sont jamais
réécrits.

### 8.5 Tâches et relances

Le statut des tâches reçoit la valeur `cancelled`.

Lors de la clôture :

- `todo`, `in_progress` et `blocked` deviennent `cancelled` ;
- `done` reste `done` ;
- l’état précédent est enregistré dans `crm_project_closure_items`.

Les relances `draft` ou `scheduled` deviennent `cancelled`. Les relances déjà
envoyées, clôturées ou réussies restent inchangées.

### 8.6 Entités conservées par le parent

Les livrables, métriques, dépenses, mouvements de trésorerie et contacts projet
restent dans leurs tables et conservent leur `project_id`.

Ils deviennent effectivement archivés et non modifiables parce que le projet
parent est archivé. Les endpoints imbriqués et directs doivent vérifier cet
état.

## 9. Matrice de traitement

| Entité | Traitement lors de la clôture |
|---|---|
| Projet | clôturé, archivé et figé |
| Devis brouillon | annulé puis archivé |
| Devis envoyé, accepté, rejeté ou expiré | archivé comme document historique |
| Facture brouillon | annulée puis archivée |
| Facture payée | archivée, paiements et reçus conservés |
| Facture ouverte | résolution obligatoire avant archivage |
| Contrat brouillon | annulé puis archivé |
| Contrat envoyé, signé, expiré ou annulé | archivé comme document historique |
| Paiement | conservé sans modification |
| Reçu | conservé et téléchargeable |
| Tâche ouverte | annulée |
| Tâche terminée | conservée |
| Relance future | annulée |
| Relance passée | conservée |
| Livrable et métrique | conservés en historique |
| Dépense et justificatif | conservés dans les rapports |
| Mouvement de trésorerie | conservé dans les rapports |
| Contact projet | relation conservée |
| Activité | conservée et complétée par la clôture |

## 10. API

### 10.1 Aperçu

```http
GET /api/v1/crm/projects/:id/closure-preview
```

Permission requise : `manage:crm`.

Réponse :

```json
{
  "data": {
    "project": {
      "id": "uuid",
      "reference": "PRJ-2026-001",
      "status": "in_progress"
    },
    "counts": {
      "devis": 1,
      "invoices": 2,
      "open_tasks": 4,
      "scheduled_reminders": 2
    },
    "invoices": [
      {
        "id": "uuid",
        "reference": "FAC-2026-010",
        "total": 500000,
        "amount_paid": 200000,
        "remaining": 300000,
        "allowed_resolutions": ["credit_note", "bad_debt"]
      }
    ],
    "preserved": {
      "payments": 1,
      "receipts": 1,
      "expenses": 2,
      "treasury_movements": 2
    },
    "closure_version": 7,
    "fingerprint": "sha256:..."
  }
}
```

### 10.2 Clôture

```http
POST /api/v1/crm/projects/:id/close-and-archive
Idempotency-Key: <uuid>
```

Permission requise : `manage:crm`.

Corps :

```json
{
  "closure_type": "client_abandoned",
  "reason": "Le client a interrompu le projet et refuse le solde restant.",
  "closure_version": 7,
  "preview_fingerprint": "sha256:...",
  "invoice_resolutions": [
    {
      "invoice_id": "uuid",
      "type": "credit_note",
      "amount": 180000,
      "reason": "Prestations restantes non réalisées",
      "external_reference": "AV-FNE-2026-001"
    },
    {
      "invoice_id": "uuid",
      "type": "bad_debt",
      "amount": 120000,
      "reason": "Travail livré non recouvré après abandon client",
      "manager_attestation": true
    }
  ]
}
```

La réponse renvoie l’opération, le projet archivé et un résumé des effets.

### 10.3 Restauration

```http
POST /api/v1/crm/projects/:id/restore
```

Permission requise : `manage:crm`.

La restauration est refusée si l’opération contient un ajustement
`credit_note` ou `bad_debt`.

L’ancien endpoint de restauration directe ne peut pas désarchiver un dossier
clos. Il doit appeler cette politique ou retourner `PROJECT_RESTORE_FORBIDDEN`.

### 10.4 Régularisation historique

```http
GET  /api/v1/crm/projects/archive-reconciliation
GET  /api/v1/crm/projects/:id/archive-reconciliation-preview
POST /api/v1/crm/projects/:id/archive-reconciliation
```

Ces endpoints utilisent la même validation et la même transaction que la
clôture normale, mais uniquement pour les projets déjà archivés sans opération
de clôture enregistrée.

## 11. Algorithme transactionnel

`closeAndArchiveProject()` applique l’ordre suivant :

1. commencer une transaction ;
2. verrouiller le projet ;
3. refuser un projet absent, déjà régularisé ou non autorisé ;
4. recalculer l’aperçu complet ;
5. comparer `closure_version` et `preview_fingerprint` ;
6. vérifier qu’une résolution couvre exactement le solde de chaque facture
   ouverte ;
7. créer l’opération de clôture ;
8. enregistrer les ajustements financiers ;
9. annuler puis archiver les brouillons ;
10. archiver les documents émis ;
11. annuler les tâches et relances ouvertes ;
12. enregistrer les éléments conservés dans le journal de clôture ;
13. clôturer et archiver le projet ;
14. écrire l’activité de synthèse ;
15. valider la transaction.

L’en-tête `Idempotency-Key` empêche une double clôture en cas de répétition
réseau.

## 12. Verrouillage après archivage

Une garde commune résout le projet parent puis refuse la mutation avec :

```json
{
  "error": "PROJECT_ARCHIVED",
  "message": "Ce dossier est archivé et ne peut plus être modifié."
}
```

Code HTTP : `409 Conflict`.

La garde couvre :

- modification, clôture ou relation de contact du projet ;
- ancien endpoint direct `/projects/:id/close` lorsqu’il tente de remplacer la
  clôture de dossier auditée ;
- ancien endpoint direct `/projects/:id/restore` lorsqu’il tente de
  désarchiver sans la politique de restauration ;
- création et modification de tâches, livrables et métriques ;
- création et modification de dépenses ;
- création, modification, envoi, signature, conversion ou archivage de devis,
  factures et contrats liés ;
- création ou modification de paiement ;
- création ou modification de relance ;
- création, modification ou suppression d’un mouvement de trésorerie lié.

Une entité non liée à un projet conserve son cycle de vie normal.

## 13. Rapports et indicateurs

Les règles de lecture deviennent explicites :

- pipeline commercial et charge opérationnelle : exclure les projets archivés ;
- relances à effectuer : exclure les relances annulées et dossiers archivés ;
- créances recouvrables : exclure les montants couverts par un avoir ou classés
  en créance abandonnée ;
- revenus facturés : afficher brut, avoirs et net séparément ;
- encaissements : conserver tous les paiements réellement reçus ;
- dépenses et trésorerie : conserver tous les flux réellement survenus ;
- créances abandonnées : afficher une ligne séparée et exportable ;
- historique client : conserver le dossier et toutes ses pièces.

## 14. UX

### 14.1 Action principale

Le libellé « Supprimer = archiver » disparaît pour les projets.

La nouvelle action est :

```text
Clore et archiver le dossier
```

### 14.2 Assistant

L’assistant comporte quatre étapes :

1. **Impact** : documents, tâches, relances et montants ;
2. **Motif** : type de clôture et explication obligatoire ;
3. **Résolution financière** : choix et justificatif par facture ;
4. **Confirmation** : résumé et saisie de la référence du projet.

Le bouton final reste désactivé tant que chaque facture ouverte n’est pas
résolue.

### 14.3 Dossier historique

Après clôture :

- un bandeau indique « Dossier archivé et figé » ;
- le type, le motif, l’auteur et la date sont visibles ;
- toutes les actions de mutation disparaissent ;
- les onglets restent consultables ;
- une section « Documents historiques » réunit devis, factures, avoirs,
  reçus et contrats ;
- les exports et téléchargements restent accessibles.

### 14.4 Reprise d’une collaboration

Si le dossier contient un avoir ou une créance abandonnée, il ne peut pas être
restauré. L’utilisateur peut créer un nouveau projet lié au dossier historique.
Le nouveau dossier possède sa propre référence et
`predecessor_project_id` pointe vers le dossier historique. Seuls le client,
l’organisation, le service et le contexte descriptif sont repris ; aucun
document ni mouvement financier n’est copié.

## 15. Archives historiques

La migration renseigne uniquement des métadonnées techniques pour les projets
déjà archivés :

- `archived_at = COALESCE(updated_at, created_at)` ;
- `archive_reason = 'Archive antérieure à la gestion des clôtures'`.

Elle ne modifie aucune dépendance.

Ces projets apparaissent dans « Archives à régulariser ». Chaque dossier doit
être inspecté et validé manuellement avec l’assistant de régularisation.

Cette règle concerne notamment les dépendances incohérentes déjà observées :
deux devis et une facture actifs liés à des projets archivés.

## 16. Permissions

- aperçu, clôture, régularisation et restauration : `manage:crm` ;
- lecture du dossier historique : `read:crm` si la politique générale autorise
  l’accès à l’archive, sinon `manage:crm` conformément au lot RBAC existant ;
- aucune permission n’autorise la modification d’un projet archivé ;
- aucun rôle applicatif ne sert de fallback.

Le premier lot conserve la règle actuelle : la visibilité des archives reste
réservée à `manage:crm`.

## 17. Erreurs métier

| Code | HTTP | Signification |
|---|---:|---|
| `PROJECT_ARCHIVED` | 409 | mutation interdite sur dossier archivé |
| `PROJECT_ALREADY_CLOSED` | 409 | clôture déjà enregistrée |
| `CLOSURE_PREVIEW_STALE` | 409 | dossier modifié depuis l’aperçu |
| `INVOICE_RESOLUTION_REQUIRED` | 422 | facture ouverte non résolue |
| `INVOICE_RESOLUTION_MISMATCH` | 422 | montant de résolution incorrect |
| `CREDIT_NOTE_REFERENCE_REQUIRED` | 422 | référence d’avoir manquante |
| `PROJECT_RESTORE_FORBIDDEN` | 409 | ajustement financier irréversible |
| `IDEMPOTENCY_CONFLICT` | 409 | clé réutilisée pour une autre demande |

## 18. Tests

### 18.1 Tests unitaires

- calcul du solde de chaque facture ;
- résolutions autorisées selon le statut ;
- empreinte d’aperçu stable ;
- détection d’aperçu périmé ;
- matrice de traitement des entités ;
- règles de restauration.

### 18.2 Tests d’intégration transactionnelle

- clôture normale d’un projet payé ;
- abandon avec avoir partiel ;
- abandon avec créance abandonnée ;
- annulation des tâches et relances ;
- conservation des paiements, reçus, dépenses et trésorerie ;
- rollback complet si une étape échoue ;
- répétition idempotente ;
- concurrence entre paiement et clôture ;
- refus de toute mutation après archivage.

### 18.3 Tests API et permissions

- `read:crm` et `write:crm` reçoivent `403` sur la clôture ;
- `manage:crm` peut prévisualiser et clôturer ;
- un rôle `admin` sans `manage:crm` ne peut pas clôturer ;
- les erreurs métier utilisent les codes définis ;
- les endpoints directs ne contournent pas le verrou parent.

### 18.4 Tests UX

- assistant inaccessible sans `manage:crm` ;
- résumé d’impact complet ;
- bouton final bloqué tant qu’une facture est ouverte ;
- confirmation par référence ;
- dossier archivé en lecture seule ;
- documents historiques téléchargeables ;
- reprise par création d’un nouveau projet.

## 19. Déploiement

Ordre recommandé :

1. ajouter les tables, colonnes, enums et index ;
2. déployer les lectures compatibles avec les anciens enregistrements ;
3. déployer le service transactionnel et les gardes ;
4. déployer l’assistant frontend ;
5. activer la régularisation historique ;
6. vérifier les rapports ;
7. traiter manuellement les archives existantes.

Aucune cascade automatique n’est exécutée au déploiement.

## 20. Risques et protections

| Risque | Protection |
|---|---|
| double soumission | clé d’idempotence et verrou projet |
| données modifiées après aperçu | version et empreinte |
| transaction partielle | transaction PostgreSQL unique |
| suppression légale/comptable | aucune suppression de pièce émise |
| avoir sans preuve | référence externe obligatoire |
| faux abandon fiscal | qualification interne et justificatif |
| contournement par endpoint direct | garde de projet dans les services |
| restauration incohérente | refus après ajustement financier |
| perte de données historiques | relations conservées et journal détaillé |
| corruption des archives existantes | régularisation manuelle |

## 21. Décisions validées

- Un projet archivé ne reçoit plus aucune mise à jour ni mouvement financier.
- Les factures ouvertes sont résolues avant l’archivage.
- Un avoir correspond à une prestation non réalisée ou une remise.
- Une prestation réalisée mais non payée reste dans la facture originale et
  produit un enregistrement séparé de créance abandonnée.
- Paiements, reçus, dépenses et mouvements existants sont conservés.
- La clôture est atomique.
- La suppression définitive est exclue de ce lot.
- Les anciennes archives sont régularisées une par une.
- Une régularisation financière empêche la restauration du dossier.
