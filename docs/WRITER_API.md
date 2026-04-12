# API Rédaction (brouillons)

Permet d’**automatiser la rédaction** (scripts, agents LLM, CMS externes) en poussant des **brouillons** dans Scoop.Afrique. La **publication** (statut `published`) reste **exclusivement** dans le backoffice, après relecture par un éditeur, manager ou admin.

## Authentification

1. Connectez-vous au backoffice avec un compte **journaliste** (ou rôle supérieur autorisé).
2. Allez dans **API rédaction (LLM)** (`/admin/writer-api`).
3. Générez une clé. Elle n’est affichée **qu’une fois** (préfixe `saw_`).

Toutes les requêtes doivent envoyer :

```http
Authorization: Bearer saw_<secret>
Content-Type: application/json
```

Les clés révoquées sont refusées immédiatement.

## Base URL

Même origine que l’API publique, par exemple :

- `https://<votre-api>/api/v1`

Préfixe Writer: `/writer`

## Créer un brouillon

`POST /api/v1/writer/articles`

Corps JSON aligné sur la création d’article admin, **sans** `status` (forcé à `draft` côté serveur).

### Option A — Texte brut

Le serveur convertit le texte en document TipTap minimal (paragraphes séparés par une ligne vide).

```json
{
  "title": "Titre de l’article",
  "body_text": "Premier paragraphe.\n\nDeuxième paragraphe.",
  "excerpt": "Résumé optionnel",
  "category_id": "uuid-categorie-optionnel",
  "tags": ["actualité"],
  "author_display_name": "Nom affiché"
}
```

### Option B — Contenu TipTap (`content`)

Envoyez le JSON TipTap habituel (comme dans l’éditeur).

```json
{
  "title": "Titre",
  "content": { "type": "doc", "content": [] }
}
```

Champs fréquents (tous optionnels sauf titre + un des deux contenus) : `slug`, `excerpt`, `category_id`, `cover_image_url`, `video_url` (YouTube), `tags`, `meta_title`, `meta_description`, `og_image_url`, `scheduled_at`, `author_display_name`.

**Réponse**: `201` avec `{ "data": <article> }` (même forme snake_case que l’API admin).

**Propriétaire** : `author_id` = profil du détenteur de la clé.

## Mettre à jour un brouillon

`PATCH /api/v1/writer/articles/:id`

- Seuls les articles dont vous êtes **auteur** peuvent être modifiés.
- Les articles **publiés** sont **verrouillés** (utilisez le backoffice).
- Statuts autorisés dans le corps : `draft` ou `review` uniquement (pas `published`, pas `scheduled`).

Vous pouvez à nouveau passer `body_text` pour remplacer le corps, ou `content` TipTap, ainsi que les autres champs partiels (titre, extrait, etc.).

## Ce qui est interdit via cette API

- Publier (`published`) ou planifier la mise en ligne de façon autonome.
- Modifier un article dont vous n’êtes pas l’auteur.
- Toute action hors `POST /writer/articles` et `PATCH /writer/articles/:id`.

## Exemple cURL

```bash
API="https://api.example.com/api/v1"
KEY="saw_xxxxxxxx"

curl -sS -X POST "$API/writer/articles" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test LLM","body_text":"Hello world."}'
```

## Bonnes pratiques

- Stockez la clé dans un secret manager, jamais dans le dépôt Git.
- Révoquez les clés compromises depuis le backoffice.
- Vérifiez les brouillons dans **Articles** avant demande de publication.
