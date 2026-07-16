---
name: scoop-afrique-notion-json
description: >-
  Veille, selection, redaction et livraison d'articles Scoop Afrique au format
  JSON importable depuis le backoffice, avec synchronisation ou preparation
  Notion. Use when the user asks for Scoop Afrique veille, series d'articles,
  articles JSON, import backoffice, brouillons manuels, Notion editorial
  tracking, or a workflow that avoids direct API/Node usage.
---

# Scoop Afrique Notion JSON

Produire une veille editoriale Scoop Afrique, rediger les articles valides, tenir le suivi Notion, puis emettre un fichier JSON compatible avec l'import manuel du backoffice.

## Ordre Obligatoire

1. Utiliser les regles de veille Scoop Afrique : quotas CI, diversite des pays, piliers, sources et anti-cluster.
2. Avant redaction, faire valider la selection si l'utilisateur demande une veille complete. Ne pas rediger les 15 articles sans validation explicite.
3. Utiliser la plume Scoop Afrique : angle africain, accroche humaine, nut graph, projection, question finale.
4. Produire un JSON conforme a `references/import-json-schema.md`.
5. Mettre a jour Notion si le connecteur Notion est disponible. Sinon produire un bloc "Notion a creer" avec les memes champs.
6. Ne pas utiliser Node ni l'API Writer pour ce workflow. La livraison cible est un fichier JSON charge manuellement dans le backoffice.
7. Ne jamais fournir de liens image, video ou autre media dans le JSON. Le choix, la verification et l'ajout des illustrations appartiennent au journaliste apres lecture et fact-checking.

## Workflow

### 1. Veille

- Consulter au moins 25 candidats avant de retenir la selection finale.
- Respecter les contraintes habituelles : 6 sujets Cote d'Ivoire sur 15, sport max 2 sur 15, min 7 pays hors CI, min 4 piliers, sources principales distinctes.
- Pour chaque sujet retenu, conserver `sources_cross` avec 3 sources minimum si le sujet est destine a etre redige.
- Rejeter les doublons de cluster : un meme fil narratif ne doit pas devenir plusieurs articles.

### 2. Notion

Lire `references/notion-workflow.md` avant toute action Notion.

Si un outil Notion est disponible :

- Chercher la base editoriale Scoop Afrique ou la page indiquee par l'utilisateur.
- Creer ou mettre a jour une ligne par sujet.
- Stocker les statuts `Veille`, `Valide`, `Redige`, `Pret import`, `Importe`, `A completer`.
- Ajouter les sources, le pays, la rubrique proposee, les alertes media/rubrique et le titre final.

Si Notion n'est pas connecte :

- Ne pas inventer une connexion.
- Produire une table Markdown "Notion a creer" avec les champs attendus.
- Dire clairement que la synchronisation directe attend le connecteur Notion.

### 3. Redaction

Chaque article doit contenir :

- `title` : titre CMS clair.
- `excerpt` : chapeau de 1-2 phrases.
- `body` : corps publiable, environ 250-350 mots, sans notes internes.
- `rubrique` ou `category_slug` : rubrique proposee. Si incertaine, garder le libelle propose et signaler la correction Notion.
- `tags` : 3 a 8 tags.
- `meta_title` ou `meta_description` : SEO obligatoire pour pouvoir soumettre plus tard.

Ne pas renseigner `cover_image_url`, `video_url`, `cover_image_credit`, `cover_image_source` ni `cover_video_credit`. Laisser ces champs absents du JSON final. Dans Notion, marquer l'article comme `Media a ajouter`.

Ne pas ajouter de prose hors CMS dans `body`.

### 4. Livraison JSON

Livrer un fichier nomme selon :

`06_Production/articles_import_DDmoisYYYY.json`

Le fichier doit etre un objet avec une cle `articles`.

Inclure uniquement les champs acceptes par l'import backoffice. Mettre les notes internes, alertes Notion et sources de controle dans un second fichier si necessaire :

`06_Production/articles_import_DDmoisYYYY_notes.md`

## Controle Avant Livraison

- [ ] JSON valide, parsable, sans commentaires.
- [ ] Chaque entree a `title`, `excerpt`, `body`, `tags`, `rubrique` ou `category_slug`.
- [ ] Les rubriques non certaines sont listees dans les notes et dans Notion.
- [ ] Aucun lien image, video ou media n'est fourni par l'agent IA.
- [ ] `Media a ajouter` est signale pour chaque article dans Notion ou dans les notes.
- [ ] Chaque article a au moins 3 sources verifiees dans le travail de redaction.
- [ ] Les articles sont en brouillon uniquement apres import.
- [ ] Aucune publication directe, aucun envoi API, aucun script Node.

## References

- Schema JSON import : `references/import-json-schema.md`
- Workflow Notion : `references/notion-workflow.md`
- Regles existantes a respecter : `.agents/skills/scoop-afrique-veille`, `.agents/skills/scoop-afrique-plume`, `.agents/skills/scoop-afrique-production`
