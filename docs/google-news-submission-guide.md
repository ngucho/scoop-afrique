# Guide de référencement Google News & Canaux de distribution

**Scoop.Afrique — Média panafricain · Abidjan, Côte d'Ivoire**

> Ce guide couvre toutes les étapes pour que les articles de Scoop.Afrique apparaissent
> dans Google News, Apple News, Flipboard, Microsoft News et les autres agrégateurs.

---

## Prérequis techniques (déjà en place)

| Élément | URL | Statut |
|---|---|---|
| Sitemap principal | `/sitemap.xml` | ✅ Actif |
| **News Sitemap** (Google News) | `/news-sitemap.xml` | ✅ Actif |
| Flux RSS enrichi | `/rss.xml` | ✅ Actif (media: namespace) |
| Schema `NewsArticle` | Sur chaque article | ✅ Actif |
| Meta `news_keywords` | Sur chaque article | ✅ Actif |
| robots.txt | `/robots.txt` | ✅ Référence les deux sitemaps |

---

## Étape 1 — Google Search Console

**Objectif** : vérifier la propriété du domaine et soumettre les sitemaps.

1. Aller sur **[search.google.com/search-console](https://search.google.com/search-console)**
2. Cliquer sur **"Ajouter une propriété"** → choisir **"Domaine"**
3. Entrer `scoop-afrique.com`
4. Choisir la méthode de vérification **DNS** (recommandée) :
   - Copier l'enregistrement TXT fourni par Google
   - L'ajouter dans les DNS du domaine (registrar ou hébergeur)
   - Cliquer **"Vérifier"** (peut prendre 24h)
5. Une fois vérifié, aller dans **"Sitemaps"** (menu gauche)
6. Soumettre ces deux sitemaps :
   ```
   https://www.scoop-afrique.com/sitemap.xml
   https://www.scoop-afrique.com/news-sitemap.xml
   ```
7. Vérifier dans l'onglet **"Couverture"** que les articles sont bien indexés

> **Astuce** : Les articles récents (< 48h) apparaissent dans Google News si le News Sitemap
> est correctement soumis. L'indexation initiale peut prendre 24-48h.

---

## Étape 2 — Google Publisher Center (obligatoire pour Google News)

**Objectif** : enregistrer Scoop.Afrique comme publication officielle dans Google News.

1. Aller sur **[publishercenter.google.com](https://publishercenter.google.com)**
2. Se connecter avec le compte Google associé à Search Console
3. Cliquer **"Ajouter une publication"**
4. Renseigner les informations :

   | Champ | Valeur |
   |---|---|
   | Nom de la publication | `Scoop.Afrique` |
   | URL | `https://www.scoop-afrique.com` |
   | Langue principale | `Français` |
   | Pays d'origine | `Côte d'Ivoire` |
   | Catégories | `Actualités générales`, `Afrique`, `Culture` |

5. **Lier à Search Console** : dans les paramètres, connecter la propriété Search Console vérifiée
6. Soumettre les URLs de contenu → Google News Sitemap :
   ```
   https://www.scoop-afrique.com/news-sitemap.xml
   ```
7. Soumettre la demande de révision

> **Délai d'approbation** : 2 à 4 semaines. Google vérifie que le site respecte les
> [règles de contenu Google News](https://support.google.com/news/publisher-center/answer/9607025).

### Règles de contenu à respecter

- ✅ Chaque article doit avoir une **date de publication visible** (déjà en place via le schema)
- ✅ Le **nom de l'auteur** doit être mentionné (déjà en place)
- ✅ Contenu original, pas de duplication
- ✅ Minimum **300 mots** par article
- ✅ Site mobile-friendly (déjà en place)
- ✅ HTTPS actif
- ❌ Pas de pop-ups intrusifs qui masquent le contenu
- ❌ Pas d'articles trompeurs ou de clickbait excessif

---

## Étape 3 — Apple News

**Objectif** : apparaître dans Apple News sur iPhone, iPad, Mac.

1. Aller sur **[apple.com/apple-news/news-publisher](https://www.apple.com/apple-news/news-publisher/)**
2. Cliquer **"Apply to become a publisher"**
3. Créer un compte Apple ID si nécessaire
4. Renseigner :
   - Nom : `Scoop.Afrique`
   - URL du site : `https://www.scoop-afrique.com`
   - URL RSS : `https://www.scoop-afrique.com/rss.xml`
   - Langue : Français
   - Catégories : Actualités, Afrique
5. Soumettre la candidature

> Le RSS de Scoop.Afrique inclut le namespace `media:` avec les images — Apple News
> l'utilise pour afficher les thumbnails dans le feed.

> **Délai** : Apple examine les candidatures manuellement (2-6 semaines).

---

## Étape 4 — Microsoft News / MSN

**Objectif** : apparaître sur MSN et dans Microsoft Edge News.

1. Aller sur **[microsoft.com/en-us/news/about/news-producer](https://www.microsoft.com/en-us/news/about/news-producer)**
2. Cliquer **"Get started as a Publisher"**
3. Créer un compte avec l'adresse `Contact@scoop-afrique.com`
4. Renseigner :
   - Organisation : `Scoop Afrique`
   - URL : `https://www.scoop-afrique.com`
   - RSS : `https://www.scoop-afrique.com/rss.xml`
   - News Sitemap : `https://www.scoop-afrique.com/news-sitemap.xml`
5. Soumettre

> **Délai** : 2-4 semaines. Les articles approuvés apparaissent sur MSN et dans
> les actualités Microsoft Edge pour les utilisateurs francophones.

---

## Étape 5 — Flipboard

**Objectif** : être indexé sur Flipboard (très populaire en Afrique francophone).

### Option A — Inscription éditeur (recommandée)

1. Aller sur **[about.flipboard.com/publishers](https://about.flipboard.com/publishers/)**
2. Cliquer **"Partner with us"**
3. Soumettre le formulaire avec le RSS : `https://www.scoop-afrique.com/rss.xml`

### Option B — Création de magazine (immédiate)

1. Créer un compte sur **[flipboard.com](https://flipboard.com)**
2. Créer un magazine public nommé `Scoop.Afrique`
3. Ajouter le flux RSS → les articles seront auto-curatés

---

## Étape 6 — Feedly

**Objectif** : être référencé dans Feedly (agrégateur professionnel, journalistes + B2B).

1. Aller sur **[feedly.com/i/sources/search/t/rss](https://feedly.com/i/sources/search/t/rss)**
2. Entrer l'URL du site → Feedly auto-découvre le RSS via le `<link rel="alternate">` dans le `<head>`
3. Pour une présence officielle : **[feedly.com/feedly-labs/publisher-rss-follow](https://feedly.com/feedly-labs/publisher-rss-follow/)**

> Le RSS Scoop.Afrique inclut `media:content` avec images → les articles s'affichent
> avec thumbnails dans Feedly (cards layout).

---

## Étape 7 — Yahoo News / Yahoo Finance (via AFP/API)

Yahoo News indexe principalement des contenus via ses partenaires d'agences (AFP, Reuters, AP).
Pour être référencé directement :

1. Soumettre via **Yahoo Publisher Network** (si disponible dans ta région)
2. Ou passer par **[ampproject.org](https://amp.dev)** — les articles AMP sont prioritaires dans Yahoo Search

---

## Étape 8 — Pocket / Instapaper

Ces services indexent automatiquement via le RSS et les partages utilisateurs.
Aucune soumission manuelle requise — la qualité du flux RSS suffit.

---

## Étape 9 — Suivi et monitoring

Une fois soumis, suivre les performances :

### Google Search Console
- **Performance → Actualités** : impressions et clics depuis Google News
- **Couverture** : articles indexés vs. erreurs
- **Sitemaps** : état du news-sitemap.xml

### Google Publisher Center
- **Analytics** : performances articles dans Google News
- **Issues** : alertes contenu non conforme

### Outils tiers
| Outil | Usage | URL |
|---|---|---|
| Rich Results Test | Vérifier le schema NewsArticle | [search.google.com/test/rich-results](https://search.google.com/test/rich-results) |
| Feed Validator | Valider le RSS | [validator.w3.org/feed](https://validator.w3.org/feed/) |
| News Sitemap Validator | Valider le news sitemap | [search.google.com/search-console](https://search.google.com/search-console) |

---

## Checklist de lancement

```
□ Google Search Console — domaine vérifié
□ Google Search Console — sitemap.xml soumis
□ Google Search Console — news-sitemap.xml soumis
□ Google Publisher Center — publication créée et liée à Search Console
□ Google Publisher Center — candidature soumise et en attente d'approbation
□ Apple News — candidature soumise
□ Microsoft News — candidature soumise
□ Flipboard — magazine créé + RSS soumis
□ Feedly — flux découvert (auto via <link rel="alternate">)
□ Rich Results Test — schema NewsArticle validé sur un article
□ Feed Validator — RSS validé sans erreurs
```

---

## Notes importantes

> **Fraîcheur du contenu** : Google News favorise fortement les articles publiés dans les 48 dernières heures.
> Le `/news-sitemap.xml` se met à jour toutes les 60 secondes pour maximiser la vitesse d'indexation.

> **Cohérence du nom** : "Scoop.Afrique" doit être **exactement identique** dans :
> - Google Publisher Center (nom de publication)
> - Le news sitemap (`<news:name>`)
> - Le schema JSON-LD (`publisher.name`)
> - Le RSS (`<title>` du channel)

> **Langue** : tous les articles étant en français, le `<news:language>fr</news:language>` dans
> le news sitemap cible directement les utilisateurs francophones dans Google News.

---

*Document créé le 1er juin 2026 — Scoop.Afrique, Abidjan, Côte d'Ivoire*
