# Runbook — Clôture de dossier projet CRM

Migration concernée : `apps/backend/drizzle/0061_crm_project_closure_lifecycle.sql`.

**État : appliquée en production le 4 août 2026** (PostgreSQL 17.6, base
`postgres`), et enregistrée dans `public.__drizzle_migrations__` sous
`created_at = 1785715200000`.

Elle a été appliquée **sans `drizzle-kit migrate`**, pour la raison décrite en
section 2.2 — lire cette section avant toute migration future, la cause est
toujours présente.

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

### 2.2 `drizzle-kit migrate` est INUTILISABLE sur ce dépôt — bloquant

**Ne lancez pas `pnpm db:migrate` sur ce dépôt sous Windows.** Il tenterait de
rejouer **les 49 migrations depuis `0000`** sur la base de production.

Cause : `drizzle-kit` identifie une migration par le SHA-256 du contenu de son
fichier `.sql`. Les lignes déjà enregistrées l'ont été à partir d'un contenu en
**LF**, alors que le dépôt est extrait en **CRLF** sur Windows (conversion Git
au checkout). Les hachages recalculés localement ne correspondent donc à rien.

Mesuré sur cette base le 4 août 2026 :

| Forme du contenu haché | Correspondances sur 49 entrées de journal |
| --- | --- |
| brut (CRLF, tel qu'extrait) | 2 |
| normalisé en LF | 45 |

Autrement dit, `migrate` ne reconnaîtrait que 2 migrations sur 49.

**Procédure sûre** — appliquer une migration ciblée puis l'enregistrer
soi-même, en hachant le contenu **normalisé en LF** :

```ts
const content = readFileSync(`drizzle/${TAG}.sql`, 'utf8').replace(/\r\n/g, '\n')
const hash = createHash('sha256').update(content).digest('hex')
// … exécuter le SQL, puis :
INSERT INTO public.__drizzle_migrations__ (hash, created_at) VALUES ($hash, $when)
```

Le `when` est celui de l'entrée de journal correspondante.

**Correctif de fond recommandé** (hors périmètre de ce chantier) : ajouter
`*.sql text eol=lf` dans `.gitattributes` et réextraire, afin que les fichiers
de migration restent en LF sur toutes les plateformes. `drizzle-kit migrate`
redeviendrait alors utilisable.

Vérification de l'état réel de la base — noter le nom exact de la table, défini
par `drizzle.config.ts` (`migrations.table`) :

```sql
SELECT hash, created_at FROM public.__drizzle_migrations__ ORDER BY created_at;
```

Une table `drizzle.__drizzle_migrations` existe aussi mais elle est **vide** :
ce n'est pas celle utilisée par ce projet.

### 2.2 bis — Fichiers `0048`–`0060` absents du journal

`_journal.json` saute du tag `0047_devis_sign_token` à
`0061_crm_project_closure_lifecycle`. Les fichiers `0048` à `0060` existent sur
disque sans entrée de journal ; ils ont été appliqués hors du mécanisme Drizzle.

Cette dérive **préexiste** à ce chantier et n'a pas été corrigée ici, pour ne
pas réécrire un historique de migrations partagé. Elle est sans effet sur
`migrate` (qui ne lit que le journal), mais elle signifie que ces treize
migrations ne sont suivies par aucun outil.

Constat au 4 août 2026 : sur les témoins vérifiés, `article_audio_jobs` existe
en base, mais `reader_saved_articles`, `reader_article_history` et
`article_visitor_metrics` **sont absents** — les migrations `0048`, `0050` et
`0058` ne semblent donc pas appliquées sur cette base. À arbitrer séparément.

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
