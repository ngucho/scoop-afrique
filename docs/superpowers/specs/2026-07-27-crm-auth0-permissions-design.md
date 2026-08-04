# Sécurisation Auth0 et permissions du CRM

Date : 27 juillet 2026  
Statut : design validé, en attente de validation du document  
Périmètre : `apps/backend` et, uniquement si nécessaire à la cohérence des droits affichés, `apps/crm`

## 1. Contexte

L’audit du CRM a identifié deux défauts de sécurité bloquants :

1. les jetons Auth0 sont décodés puis contrôlés sur `iss`, `aud` et `exp`, mais leur signature cryptographique n’est pas vérifiée ;
2. le backend déduit un rôle applicatif des permissions Auth0, puis autorise la majorité des routes CRM à tout rôle `editor`, ce qui permet à un utilisateur disposant seulement de `read:crm` de modifier des données.

La documentation Auth0 du dépôt prévoit déjà trois permissions cumulatives :

- `read:crm` pour consulter le CRM ;
- `write:crm` pour créer et modifier les données courantes ;
- `manage:crm` pour les opérations sensibles.

Les rôles Auth0 documentés sont compatibles avec ce modèle :

- `editor` : `read:crm` et `write:crm` ;
- `manager` : permissions de l’éditeur et `manage:crm` ;
- `admin` : toutes les permissions CRM.

Ce lot sécurise l’authentification et l’autorisation avant de modifier le cycle d’archivage des projets.

## 2. Objectifs

- Vérifier cryptographiquement tous les jetons Auth0 utilisés pour autoriser une requête.
- Utiliser les permissions CRM exactes comme source de vérité.
- Interdire toute mutation à un utilisateur qui ne possède que `read:crm`.
- Réserver les opérations sensibles à `manage:crm`.
- Conserver le comportement fonctionnel des utilisateurs correctement configurés dans Auth0.
- Couvrir la vérification JWT et la matrice des permissions par des tests automatisés.
- Produire des erreurs HTTP cohérentes et des journaux utiles sans exposer de données sensibles.

## 3. Hors périmètre

Ce lot ne modifiera pas :

- les données CRM existantes ;
- les règles d’archivage en cascade ;
- les clés étrangères ou migrations de base de données ;
- les statuts métier des devis, factures, contrats, paiements ou projets ;
- l’ergonomie générale du CRM ;
- la configuration effective des utilisateurs dans le tableau de bord Auth0.

Le prochain lot traitera séparément le cycle transactionnel d’archivage et de restauration.

## 4. Architecture d’authentification

### 4.1 Vérification cryptographique

La vérification des jetons d’accès utilisera `jose`, déjà présent dans les dépendances du backend :

- `createRemoteJWKSet` pour obtenir les clés publiques du tenant Auth0 ;
- `jwtVerify` pour valider la signature ;
- algorithme accepté : `RS256` ;
- émetteur attendu : `https://<AUTH0_DOMAIN>/` ;
- audience attendue : `AUTH0_AUDIENCE` ;
- tolérance d’horloge : 30 secondes.

Le jeu de clés distant sera créé une seule fois par configuration Auth0 et réutilisé. Le cache et la rotation des clés seront pris en charge par `jose`.

La validation sera asynchrone. Les appels actuels à `verifyAuth0Token`, `verifyReaderAuth0Token` et aux fonctions d’inspection utilisées pour autoriser les routes seront adaptés pour attendre le résultat.

### 4.2 Décodage non vérifié

Le décodage Base64 du contenu d’un JWT restera autorisé seulement pour :

- produire un résumé de diagnostic sans secret ;
- lire un identifiant à des fins de journalisation ne donnant aucun accès.

Aucune décision d’authentification ou d’autorisation ne pourra dépendre d’un contenu uniquement décodé.

En particulier, l’attribution automatique du rôle lecteur par l’API Auth0 Management ne pourra pas utiliser un `sub` provenant d’un simple décodage. Le résultat d’inspection devra transporter séparément le `sub` cryptographiquement vérifié lorsque le jeton est valide mais dépourvu de permission.

Les noms et commentaires du code distingueront explicitement « décodé » de « vérifié » afin d’éviter une régression future.

### 4.3 Claims acceptés

Après vérification cryptographique, le backend exigera :

- un `sub` non vide ;
- un tableau `permissions` composé de chaînes pour les routes protégées par permission ;
- les claims standards validés par `jwtVerify`.

Un claim `permissions` absent ou mal formé équivaudra à une liste vide. Il ne provoquera pas une élévation de privilèges.

L’adresse email restera facultative pour l’autorisation. Sa lecture conservera les variantes actuellement prises en charge : claim standard, claim namespacé et `user_metadata`.

## 5. Modèle d’autorisation CRM

### 5.1 Source de vérité

Les permissions contenues dans le jeton Auth0 vérifié seront propagées jusqu’au contexte Hono avec l’utilisateur authentifié.

Les rôles applicatifs (`journalist`, `editor`, `manager`, `admin`) pourront continuer à être calculés pour l’affichage et les fonctionnalités éditoriales existantes, mais ils ne décideront plus de l’accès aux routes CRM.

Il n’existera aucun contournement CRM fondé sur :

- `publish:articles` ;
- `delete:articles` ;
- `manage:users` ;
- le rôle enregistré dans la table `profiles`.

Les permissions seront vérifiées exactement. Un jeton ayant `manage:crm` mais pas `read:crm` ou `write:crm` n’héritera pas implicitement de ces droits. Les rôles Auth0 doivent donc conserver les permissions cumulatives documentées.

### 5.2 Matrice des permissions

| Catégorie | Permission requise | Opérations |
|---|---|---|
| Lecture | `read:crm` | `GET`, listes, fiches, tableaux de bord, rapports, PDF et historiques |
| Écriture courante | `write:crm` | créations, modifications, associations, tâches, livrables, dépenses, paiements et envois courants |
| Administration | `manage:crm` | archivage, restauration, clôture, suppression, configuration, référentiel de services, trésorerie et transitions métier déjà réservées aux managers |

Les routes existantes seront classées explicitement. La méthode HTTP seule ne suffira pas pour les opérations particulières telles que `close`, `restore`, `convert`, `sign` ou `send`.

### 5.3 Opérations sensibles

Les opérations suivantes exigeront `manage:crm` :

- tous les `DELETE`, qu’ils archivent ou suppriment ;
- toutes les restaurations ;
- la clôture d’un projet ;
- la conversion d’un devis en projet ;
- la création et la signature administrative d’un contrat ;
- toutes les mutations du référentiel de services ;
- toutes les mutations des paramètres CRM et règles de relance ;
- toutes les mutations de trésorerie ;
- toute opération actuellement réservée à `manager` ou `admin`.

La lecture de ces ressources restera accessible avec `read:crm`.

Les autres mutations exigeront `write:crm`.

## 6. Middleware et intégration

Le backend fournira un middleware dédié, par exemple `requirePermission`, qui :

1. s’exécute après `requireAuth` ;
2. récupère l’utilisateur et ses permissions vérifiées dans le contexte ;
3. accepte une ou plusieurs permissions explicitement déclarées ;
4. renvoie `401` si aucun utilisateur authentifié n’est présent ;
5. renvoie `403` si la permission demandée manque ;
6. journalise la route et la permission refusée sans journaliser le jeton.

Les routeurs CRM conserveront `requireAuth` comme garde globale. Les gardes basées sur `requireRole` seront remplacées par des gardes de permissions sur chaque groupe ou chaque route.

Les routes non CRM ne seront pas migrées vers le nouveau modèle de permissions dans ce lot, sauf adaptations strictement nécessaires au passage de la vérification JWT en mode asynchrone.

## 7. Jetons lecteurs

Les routes lecteurs utilisent actuellement le même principe de décodage non signé. Elles seront sécurisées dans le même lot afin qu’aucun chemin d’accès Auth0 ne continue à faire confiance à un jeton falsifiable.

La règle métier actuelle reste inchangée :

- `access:reader` autorise les fonctions du compte lecteur ;
- les permissions staff autorisent les usages lecteurs déjà prévus par le code ;
- un jeton ne disposant d’aucune permission reconnue est refusé.

La modification porte uniquement sur la preuve cryptographique de l’origine du jeton.

L’éventuel amorçage du rôle lecteur ne sera tenté qu’après validation réussie de la signature, de l’émetteur, de l’audience, de l’expiration et du `sub`. Un jeton falsifié ne devra provoquer aucun appel de modification vers Auth0 Management.

## 8. Gestion des erreurs et observabilité

### 8.1 Réponses HTTP

- Absence de jeton : `401`, code `NO_TOKEN`.
- Jeton mal formé, falsifié, expiré, mauvais émetteur ou mauvaise audience : `401`, code `INVALID_TOKEN`.
- Permission insuffisante : `403`, code `INSUFFICIENT_PERMISSION`.
- Configuration Auth0 absente : `503`, code `CONFIG`.
- Service JWKS Auth0 temporairement indisponible sans clé exploitable en cache : `503`, code `AUTH_PROVIDER_UNAVAILABLE`.

Les réponses ne révéleront ni la clé recherchée, ni les claims internes, ni la raison cryptographique détaillée.

### 8.2 Journaux serveur

Les journaux pourront distinguer :

- format JWT invalide ;
- signature invalide ;
- émetteur ou audience incorrects ;
- expiration ;
- permission absente ;
- indisponibilité temporaire du JWKS.

Ils ne contiendront jamais le jeton complet. Le `sub` éventuellement journalisé restera tronqué selon le mécanisme de résumé existant.

Une indisponibilité du JWKS ne devra pas conduire à accepter le jeton. L’accès échouera de manière fermée.

## 9. Stratégie de tests

Les tests seront écrits avant les changements de production.

### 9.1 Tests JWT

Les tests signeront de vrais JWT avec une paire de clés de test et couvriront :

- jeton RS256 valide ;
- signature falsifiée ;
- clé inconnue ;
- algorithme non autorisé ;
- jeton expiré ;
- émetteur incorrect ;
- audience incorrecte ;
- `sub` absent ;
- permissions absentes ou mal formées ;
- rotation simulée de clé ;
- jeton lecteur valide et jeton lecteur sans permission.
- absence d’appel d’amorçage Auth0 avec un jeton lecteur falsifié.

La logique sera structurée pour injecter un résolveur de clé dans les tests sans effectuer d’appel au tenant Auth0 réel.

### 9.2 Tests des permissions

La matrice minimale vérifiera :

| Permission du jeton | Lecture | Écriture | Administration |
|---|---:|---:|---:|
| aucune permission CRM | 403 | 403 | 403 |
| `read:crm` | autorisée | 403 | 403 |
| `read:crm`, `write:crm` | autorisée | autorisée | 403 |
| `read:crm`, `write:crm`, `manage:crm` | autorisée | autorisée | autorisée |

Des tests de routage représentatifs couvriront au minimum :

- une liste CRM ;
- une création ou modification courante ;
- un archivage ;
- une restauration ;
- une mutation de paramètres ;
- une mutation de trésorerie.

### 9.3 Vérifications générales

Après implémentation :

- tous les tests backend existants doivent rester verts ;
- les nouveaux tests de sécurité doivent être verts ;
- le build TypeScript du backend doit réussir ;
- le lint des fichiers modifiés ne doit introduire aucune nouvelle erreur ;
- le build du CRM sera exécuté si son code d’autorisation est modifié.

## 10. Compatibilité et déploiement

Il n’y aura pas de compatibilité temporaire avec les anciens rôles calculés pour les routes CRM : elle réintroduirait le défaut corrigé.

Avant le déploiement, la configuration Auth0 devra respecter la documentation :

- RBAC activé ;
- ajout des permissions dans l’access token activé ;
- `editor` : `read:crm`, `write:crm` ;
- `manager` et `admin` : `read:crm`, `write:crm`, `manage:crm` ;
- algorithme de signature de l’API : RS256 ;
- domaine et audience identiques à ceux configurés dans le backend.

Les utilisateurs déjà connectés devront éventuellement renouveler leur session pour recevoir un jeton contenant les permissions actualisées.

La modification ne nécessite aucune migration de base de données et peut être annulée au niveau du code. En cas d’erreur de configuration Auth0, l’accès échouera de manière visible et fermée plutôt que d’accepter des jetons non vérifiés.

## 11. Critères d’acceptation

Le lot sera accepté lorsque :

1. un JWT fabriqué localement sans la clé Auth0 est refusé ;
2. un JWT Auth0 RS256 valide est accepté ;
3. `read:crm` ne permet aucune mutation ;
4. `write:crm` permet les mutations courantes mais aucune opération d’administration ;
5. `manage:crm` permet les opérations sensibles lorsque les permissions cumulatives sont présentes ;
6. les routes lecteurs ne font plus confiance à un jeton uniquement décodé ;
7. aucun contrôle CRM ne dépend d’une permission éditoriale ou du rôle en base ;
8. les nouveaux tests et les tests backend existants réussissent ;
9. les builds concernés réussissent ;
10. aucun enregistrement CRM n’est créé, modifié ou supprimé par cette livraison.

## 12. Décisions retenues

- Approche choisie par l’utilisateur : sécurité avant archivage.
- Autorisation CRM fondée sur les permissions exactes, sans héritage implicite.
- Vérification JWKS distante avec cache et rotation gérés par `jose`.
- Sécurisation simultanée des jetons staff et lecteurs.
- Aucun changement de données ou de cycle métier dans ce lot.
