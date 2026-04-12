# Tribune — guardrails, rumeurs & recherche produit

## Objectif

Encadrer l’évolution de la Tribune « social » (fil infini, votes, réactions, commentaires) pour maximiser l’engagement **sans** amplifier la désinformation, le harcèlement ou les campagnes coordonnées (*brigading*).

## Mécanismes de rumeur (recherche — rappels opérationnels)

- **Nouveauté / surprise** : les contenus émotionnellement chargés circulent plus vite ; le feed doit équilibrer récence et **qualité / vérifiabilité**.
- **Preuve sociale** : votes et réactions renforcent la visibilité ; risque de boucles de confirmation. Prévoir **décroissance temporelle** (*time decay*) et **plafonds** sur l’impact d’un même cluster d’acteurs.
- **Répétition** : la même affirmation vue plusieurs fois augmente la croyance ; limiter le **double comptage** de signaux (ex. même IP / même device) et surveiller les motifs répétitifs.
- **Émotions fortes** : colère / indignation boostent le partage ; modération et **signalement** doivent rester à faible friction pour la communauté.

## Guardrails techniques (implémentés ou à renforcer)

| Domaine            | Statut actuel                                      | Suite recommandée                                      |
|-------------------|-----------------------------------------------------|--------------------------------------------------------|
| Publication | Live par défaut (`approved`), suspendre côté admin | File de signalements, quotas, détection spam basique   |
| Identité          | Vote / commentaire liés au profil staff/lecteur    | Option anonymisée contrôlée, rate limits par `sub`    |
| Commentaires      | Auto-approuvés (`approved`)                         | Filtre mots-clés, shadow queue pour comptes à risque  |
| Métriques annonceurs | Snapshots append-only, RBAC editor/manager      | Connecteurs API réseaux, validation audit |
| Données perso     | Profil lecteur + sync Auth0 (si M2M configuré)      | Minimisation, export RGPD, consentements clairs         |

## Indicateurs à suivre (produit)

- Rétention Tribune (sessions / utilisateur actif).
- Taux de contribution (posts / DAU).
- Taux de signalement / 1k impressions tribune.
- Temps de modération moyen sur posts suspendus.
- Diversité du fil (entropie catégories / auteurs uniques).

## Expérimentation

Toute modification du **ranking** (tendance vs récent) doit être testée en A/B avec garde-fous sur la part de contenus signalés ou à faible confiance.

## Références internes

- API Tribune : `GET/POST /api/v1/contributions`, sous-ressources `votes`, `reactions`, `comments`, `reports`.
- Métriques audience : `POST /api/v1/admin/reader/audience-metrics` (manager+), public `GET /api/v1/public/audience/summary`.
