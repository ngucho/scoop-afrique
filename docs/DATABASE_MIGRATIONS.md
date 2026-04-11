# Migrations PostgreSQL — éviter les dérives schéma / code

## Ce qui a causé les erreurs « Failed query » sur les pubs (ads)

Deux fichiers **`0027_*.sql`** définissaient **`ad_campaigns`** et **`ad_creatives`** avec des colonnes différentes. Le premier exécuté créait la table ; le second faisait **`CREATE TABLE IF NOT EXISTS`** et **ne modifiait rien**. Le code Drizzle (`apps/backend/src/db/schema.ts`) attendait la forme « reader platform », d’où des colonnes manquantes en production.

## Règles à suivre (équipe)

1. **Une seule vérité** : le schéma applicatif est **`schema.ts`**. Toute évolution passe par **`drizzle-kit generate`** ou un fichier SQL **`00xx_*.sql`** qui fait surtout des **`ALTER TABLE`** / **`ADD COLUMN`**, pas un second **`CREATE TABLE`** concurrent pour la même table.
2. **Ne pas dupliquer** `CREATE TABLE IF NOT EXISTS` pour les mêmes noms de tables dans des migrations parallèles sans migration de rattrapage explicite.
3. **Avant ou après déploiement backend** : appliquer les migrations sur la base cible (`pnpm db:migrate` avec la bonne `DATABASE_URL`).
4. **Contrôle rapide** : après migrate, exécuter  
   `pnpm --filter @scoop-afrique/backend run verify:reader-ads-schema`  
   (vérifie les colonnes critiques `ad_campaigns` / `ad_creatives`).  
   Ou en une commande :  
   `pnpm --filter @scoop-afrique/backend run db:migrate:verify`

## Limites (honnêteté)

Aucun processus ne garantit **zéro** problème DB : erreur humaine, ordre des migrations, base restaurée depuis une ancienne sauvegarde, etc. En revanche, respecter les règles ci-dessus et lancer **`verify:reader-ads-schema`** en staging/prod après migrate **réduit fortement** le risque de reproduire ce type d’incident.

## Fichiers de rattrapage déjà en place

- **`0033_ad_campaigns_reader_platform_align.sql`** — aligne `ad_campaigns`.
- **`0034_ad_creatives_reader_platform_align.sql`** — aligne `ad_creatives`.
- **`0035_drop_ad_creatives_slot_id.sql`** — supprime la colonne legacy `ad_creatives.slot_id` (emplacement = `ad_campaigns.slot_id` uniquement).

Pour étendre les vérifications à d’autres tables, dupliquer le modèle de `apps/backend/scripts/verify-reader-ads-schema.ts`.
