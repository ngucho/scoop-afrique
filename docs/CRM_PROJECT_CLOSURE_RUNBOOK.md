# Runbook — Clôture de dossier projet CRM

Migration concernée : `apps/backend/drizzle/0061_crm_project_closure_lifecycle.sql`.

**État : appliquée en production le 4 août 2026** (PostgreSQL 17.6, base
`postgres`), et enregistrée dans `public.__drizzle_migrations__` sous
`created_at = 1785715200000`.

Elle a été appliquée **sans `drizzle-kit migrate`**, cet outil étant alors
inutilisable sur ce dépôt (section 2.2). La cause a depuis été corrigée, ainsi
que l'historique des migrations `0048`–`0060` (section 2.2 bis) : `pnpm
db:migrate` est de nouveau la commande normale.

---

## 1. Ce que change la fonctionnalité

L'archivage isolé d'un projet est remplacé par une **clôture transactionnelle** :

- toute facture ouverte doit être résolue (paiement existant, avoir, ou créance
  abandonnée) avant la clôture ;
- la clôture archive devis, factures et contrats, annule les tâches ouvertes et
  les relances programmées, et fige le projet ;
- paiements, reçus, dépenses et mouvements de trésorerie sont **conservés
  intégralement** — jamais supprimés, jamais réécrits ;
- après archivage, toute mutation d'une entité rattachée est refusée
  (`409 PROJECT_ARCHIVED`) ;
- un dossier scellé par un avoir ou une créance abandonnée **ne peut plus être
  rouvert** ; il se prolonge par un nouveau projet lié
  (`predecessor_project_id`).

Routes ajoutées, toutes en `manage:crm` exact :

| Méthode | Chemin | Rôle |
| --- | --- | --- |
| `GET` | `/projects/:id/closure-preview` | Aperçu, version et empreinte |
| `POST` | `/projects/:id/close-and-archive` | Clôture (en-tête `Idempotency-Key` UUID requis) |
| `POST` | `/projects/:id/create-follow-up` | Nouveau projet lié à une archive scellée |
| `GET` | `/projects/archive-reconciliation` | File des archives héritées |
| `POST` | `/projects/:id/archive-reconciliation` | Régularisation d'une archive héritée |

Routes retirées de leur ancien comportement :

- `DELETE /projects/:id` et `POST /projects/:id/close` renvoient désormais
  `409 PROJECT_CLOSURE_REQUIRED` ;
- `POST /projects/:id/restore` délègue à `restoreClosedProject()` et renvoie
  `409 PROJECT_RESTORE_FORBIDDEN` si le dossier porte un ajustement financier.

---

## 2. Préconditions de déploiement

### 2.1 Sauvegarde obligatoire

Une sauvegarde complète de la base est requise **avant** l'application. La
migration est additive, mais elle modifie un type énuméré
(`ALTER TYPE crm_task_status ADD VALUE 'cancelled'`), opération non réversible
par `DROP`.

### 2.2 Fins de ligne — corrigé le 4 août 2026

`drizzle-kit` identifie une migration par le SHA-256 du contenu de son fichier
`.sql`. Le dépôt n'avait pas de `.gitattributes` et `core.autocrlf=true` (défaut
Windows) extrayait les fichiers en **CRLF**, alors que les migrations déjà
appliquées avaient été hachées en **LF**.

Conséquence mesurée avant correction : `migrate` ne reconnaissait plus que
**2 migrations sur 49** et aurait rejoué tout l'historique depuis `0000` sur la
base de production.

| Forme du contenu haché | Avant correctif | Après correctif |
| --- | --- | --- |
| brut, tel qu'extrait | 2 / 49 | 46 / 49 |
| normalisé en LF | 45 / 49 | 46 / 49 |

**Correctif appliqué** : un `.gitattributes` à la racine force `*.sql text
eol=lf` (ainsi que `drizzle/meta/*.json`), et les fichiers ont été réextraits.
Les 64 fichiers `.sql` ne contiennent plus aucun CR.

Ne supprimez pas ce `.gitattributes` : le problème reviendrait à la première
extraction sous Windows.

Vérification de l'état réel de la base — noter le nom exact de la table, défini
par `drizzle.config.ts` (`migrations.table`) :

```sql
SELECT hash, created_at FROM public.__drizzle_migrations__ ORDER BY created_at;
```

Une table `drizzle.__drizzle_migrations` existe aussi mais elle est **vide** :
ce n'est pas celle utilisée par ce projet.

### 2.2 bis — Historique `0048`–`0060` réconcilié le 4 août 2026

`_journal.json` sautait du tag `0047_devis_sign_token` à
`0061_crm_project_closure_lifecycle` : les treize fichiers `0048`–`0060`
existaient sur disque sans entrée de journal ni ligne de suivi.

État constaté puis corrigé :

| Migrations | Constat | Action |
| --- | --- | --- |
| `0051`–`0060` (10) | déjà appliquées en base | enregistrées, sans réexécution |
| `0048`, `0049`, `0050` (3) | **absentes** de la base | appliquées puis enregistrées |

Les trois appliquées créent `reader_saved_articles`, `reader_article_history`
et cinq index de lecture publique (dont deux trigrammes, d'où
`CREATE EXTENSION pg_trgm`). L'event trigger `ensure_public_table_rls` posé par
`0057` a automatiquement activé la RLS sur les deux nouvelles tables ; aucun
droit n'est accordé à `anon` ni `authenticated`.

Le journal compte désormais **62 entrées contiguës** (`idx` 0 à 61), `0061`
ayant été renuméroté de `idx=48` à `idx=61`. Le suivi se faisant par hachage et
non par `idx`, cette renumérotation est sans effet sur l'appariement.

### 2.2 ter — Hachages `0027_*` réalignés

Trois fichiers (`0027_reader_digest`, `0027_media_operations`,
`0027_reader_platform_admin`) avaient un contenu divergeant du hachage
enregistré. Vérifié : **tous** les objets qu'ils déclarent existent en base, et
les deux modifications retrouvées dans l'historique Git sont sémantiquement
neutres (un commentaire ; l'ajout de gardes `EXCEPTION WHEN duplicate_object`).
Leurs hachages enregistrés ont donc été réalignés sur le contenu actuel.

Sans ce réalignement `migrate` aurait tenté de les rejouer, et
`0027_reader_digest` aurait échoué : ses `CREATE TYPE` ne sont pas gardés.

**Résultat** : `pnpm db:migrate` est de nouveau utilisable et ne fait plus rien
(exécuté à blanc le 4 août 2026, volumétrie inchangée).

Subsiste une ligne de suivi orpheline (`created_at=1742428800000`) sans fichier
correspondant, vestige d'une migration supprimée ou renommée. Sans effet :
`drizzle-kit` ignore les lignes qu'il ne connaît pas.

### 2.3 Permissions Auth0

Les cinq routes de clôture exigent `manage:crm` **exact** — aucun repli par
rôle, aucune inclusion implicite depuis `read:crm` ou `write:crm`.

---

## 3. Application de la migration — journal d'exécution

Appliquée le **4 août 2026**, en trois temps, sans `drizzle-kit migrate` :

1. `ALTER TYPE public.crm_task_status ADD VALUE IF NOT EXISTS 'cancelled'` isolé
   en premier — cette instruction ne tolère pas toujours un bloc transactionnel
   implicite selon la version PostgreSQL ;
2. le reste du fichier, en un seul lot ;
3. `INSERT INTO public.__drizzle_migrations__ (hash, created_at)` avec le
   SHA-256 du contenu **normalisé en LF** :
   `5e89788d3775977de92d788bef45db68a0f227c967646b66d649de1f4392c704`
   et `created_at = 1785715200000`.

La migration étant intégralement idempotente (`IF NOT EXISTS`, gardes `DO $$`),
elle peut être rejouée sans dommage.

Résultat mesuré : 18 vérifications sur 18 (section 4), volumétrie inchangée
(47 projets, 47 factures, 3 tâches, 44 paiements), 6 archives régularisables.

---

## 4. Vérifications post-migration

### 4.1 Structure

```sql
-- Les trois nouvelles tables existent et sont protégées par RLS.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'crm_project_closure_operations',
    'crm_project_closure_items',
    'crm_invoice_adjustments'
  );
-- Attendu : 3 lignes, rowsecurity = true partout.

-- Aucun droit accordé à anon ou authenticated.
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'crm_project_closure_operations',
    'crm_project_closure_items',
    'crm_invoice_adjustments'
  )
  AND grantee IN ('anon', 'authenticated');
-- Attendu : 0 ligne.

-- Politique service_role présente sur chaque table.
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'crm_%closure%' OR tablename = 'crm_invoice_adjustments';
-- Attendu : 3 politiques, roles = {service_role}.

-- Clé d'idempotence unique.
SELECT indexname FROM pg_indexes
WHERE tablename = 'crm_project_closure_operations'
  AND indexdef LIKE '%UNIQUE%idempotency_key%';

-- Nouvelle valeur d'énumération.
SELECT unnest(enum_range(NULL::crm_task_status));
-- Attendu : todo, in_progress, done, blocked, cancelled.
```

### 4.2 Backfill

La migration ne touche **que** les métadonnées du projet :

```sql
SELECT count(*) AS archives_sans_date
FROM crm_projects
WHERE is_archived = true AND archived_at IS NULL;
-- Attendu : 0.
```

Aucune entité enfant (devis, facture, contrat, tâche, relance) n'est modifiée
par la migration. Les archives antérieures restent délibérément non
régularisées.

### 4.3 Archives héritées à régulariser

```sql
SELECT count(*) AS a_regulariser
FROM crm_projects p
WHERE p.is_archived = true
  AND NOT EXISTS (
    SELECT 1 FROM crm_project_closure_operations o
    WHERE o.project_id = p.id AND o.status = 'completed'
  );
```

Ce compte doit correspondre au nombre de lignes affichées par
`GET /projects/archive-reconciliation` et par le bloc « Archives à régulariser »
de la liste des projets. Il ne décroît que par régularisation manuelle.

---

## 5. Tests de fumée

Trois comptes, aux permissions exactes :

| Compte | Permissions | Attendu |
| --- | --- | --- |
| lecteur | `read:crm` | `403` sur `closure-preview` et `close-and-archive` |
| rédacteur | `read:crm`, `write:crm` | `403` sur les deux |
| responsable | `manage:crm` | `200` sur l'aperçu, clôture possible |

Parcours à valider sur un projet de test :

1. ouvrir l'assistant, vérifier les compteurs de l'étape 1 ;
2. tenter une résolution partielle → refus `422`
   `INVOICE_RESOLUTION_MISMATCH` ;
3. saisir un avoir sans référence externe → refus `422`
   `CREDIT_NOTE_REFERENCE_REQUIRED` ;
4. clôturer correctement → `200`, projet archivé, bandeau lecture seule ;
5. rejouer la même requête avec la **même** `Idempotency-Key` → même
   `operation_id`, aucune seconde clôture ;
6. rejouer avec la même clé et un corps différent → `409`
   `IDEMPOTENCY_CONFLICT` ;
7. tenter `PATCH /projects/:id` → `409 PROJECT_ARCHIVED` ;
8. tenter `POST /projects/:id/restore` → `409 PROJECT_RESTORE_FORBIDDEN` ;
9. télécharger un PDF de facture du dossier archivé → toujours accessible ;
10. « Créer un nouveau projet lié » → nouveau projet, référence neuve,
    `predecessor_project_id` renseigné, aucun document ni mouvement copié.

---

## 6. Retour arrière

### 6.1 Le déploiement de code échoue avant toute régularisation

Redéployer la version de code précédente. La migration est additive : les
colonnes et tables ajoutées sont ignorées par l'ancien code, aucune donnée
n'est perdue. Les trois nouvelles tables restent vides tant qu'aucune clôture
n'a eu lieu.

Ne pas supprimer la valeur `cancelled` de `crm_task_status` : PostgreSQL ne sait
pas retirer une valeur d'un type énuméré.

### 6.2 Après des clôtures effectives

**Aucun retour arrière par édition SQL d'un avoir ou d'une créance abandonnée.**
Ces écritures sont des pièces comptables. Une clôture erronée se corrige :

- si elle ne porte **aucun** ajustement : par `POST /projects/:id/restore`, qui
  rejoue exactement les éléments de l'opération concernée ;
- si elle porte un avoir ou une créance abandonnée : par une écriture
  comptable compensatoire décidée hors de l'application, jamais par
  `DELETE`/`UPDATE` sur `crm_invoice_adjustments`.

---

## 7. Hors périmètre

- Suppression SQL définitive d'un dossier.
- Intégration de l'API FNE (facture normalisée électronique).
- Régularisation automatique des archives antérieures : elle reste manuelle et
  explicite, par choix.
