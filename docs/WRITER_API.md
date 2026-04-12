# API Rédaction (Writer API — brouillons)

Permet d’**automatiser la rédaction** (scripts, agents LLM, CMS externes) en poussant des **brouillons** dans Scoop.Afrique. La **publication** (statut `published`) et la **planification éditoriale** au sens « mise en ligne » restent **exclusivement** dans le backoffice, après action d’un éditeur, manager ou admin.

---

## Authentification

1. Connectez-vous au backoffice avec un compte **journaliste** (ou rôle supérieur autorisé à générer une clé).
2. Allez dans **API rédaction (LLM)** (`/admin/writer-api`).
3. Générez une clé. Elle n’est affichée **qu’une fois** (préfixe `saw_`).

Toutes les requêtes doivent envoyer :

```http
Authorization: Bearer saw_<secret>
Content-Type: application/json
```

Les clés **révoquées** sont refusées immédiatement (`401`).

---

## Base URL

Même origine que l’API publique, avec le préfixe versionné :

| Élément   | Valeur (exemple)        |
|----------|-------------------------|
| Préfixe  | `/api/v1`               |
| Writer   | `/writer`               |
| Création | `POST /api/v1/writer/articles` |
| Mise à jour | `PATCH /api/v1/writer/articles/:id` |

Exemple absolu : `https://<votre-backend>/api/v1/writer/articles`

---

## Identité de l’auteur (obligatoire à lire)

| Champ / concept | Comportement |
|-----------------|--------------|
| **`author_id`** | **Ne pas envoyer.** Il n’existe pas dans le corps accepté. Toute clé inconnue est **rejetée** (`400` — schéma strict). L’auteur de l’article est **toujours** le profil (journaliste) lié à la clé API. |
| **`author_display_name`** | **Optionnel**, **création uniquement** (`POST`). Surcharge d’affichage du nom sur l’article (byline). Ce n’est **pas** un identifiant d’utilisateur ; l’identité réelle reste le détenteur de la clé. |
| **`status`** | **Ne pas envoyer en création** — le serveur force **`draft`**. En **`PATCH`**, seuls **`draft`** et **`review`** sont autorisés. |

En résumé : vous ne choisissez jamais « pour qui » vous publiez côté identité technique ; c’est déduit de la **clé**.

---

## Champs acceptés — `POST /api/v1/writer/articles`

Le JSON doit respecter le schéma **strict** : **aucune propriété en plus** (pas de `author_id`, `user_id`, `created_by`, etc.).

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| `title` | Oui | Titre (max 500 caractères). |
| `body_text` **ou** `content` | Au moins un des deux | `body_text` : texte brut ; paragraphes séparés par une **ligne vide**. `content` : document **TipTap** JSON (`{ "type": "doc", ... }`). |
| `slug` | Non | Si absent, dérivé du titre (unicité gérée côté serveur). Format : minuscules, chiffres, tirets. |
| `excerpt` | Non | Résumé / chapô. |
| `category_id` | Non | UUID d’une catégorie existante, ou chaîne vide → `null`. |
| `cover_image_url` | Non | URL absolue d’image de couverture. |
| `video_url` | Non | URL **YouTube** uniquement (`youtube.com` / `youtu.be`). |
| `tags` | Non | Tableau de chaînes (max 20). Défaut : `[]`. |
| `meta_title` | Non | SEO. |
| `meta_description` | Non | SEO. |
| `og_image_url` | Non | Image Open Graph (URL). |
| `scheduled_at` | Non | ISO 8601 datetime. Peut être stocké pour préparation ; **la mise en ligne publique** reste au backoffice. |
| `author_display_name` | Non | Surcharge d’affichage du nom (voir section ci-dessus). |

**Réponse** : `201` avec `{ "data": <article> }` (objet article, champs en **snake_case**, comme l’API admin).

**Effet serveur** : `author_id` / `authorId` en base = profil du **détenteur de la clé** ; `status` = `draft`.

---

## Champs acceptés — `PATCH /api/v1/writer/articles/:id`

Corps JSON **strict**, **tous les champs optionnels** (mise à jour partielle).

| Champ | Notes |
|-------|--------|
| `title`, `slug`, `excerpt`, `category_id`, `content`, `cover_image_url`, `video_url`, `tags`, `meta_title`, `meta_description`, `og_image_url`, `scheduled_at` | Comme à la création (types identiques). |
| `body_text` | Remplace le corps en le convertissant en TipTap (même règle que le `POST`). |
| `status` | **`draft`** ou **`review`** uniquement. |

**Non accepté en PATCH** : `author_display_name` (retiré du schéma Writer pour les mises à jour — utiliser le backoffice si besoin de modifier ce champ).

**Règles d’accès** :

- Seuls les articles dont vous êtes **auteur** (`author_id` = profil de la clé) peuvent être modifiés (`403` sinon).
- Les articles **`published`** sont **verrouillés** via cette API (`403` — code `PUBLISHED_LOCKED`).

**Réponse** : `200` avec `{ "data": <article> }`.

---

## Erreurs HTTP courantes

| Code | Signification typique |
|------|-------------------------|
| `400` | JSON invalide, validation Zod (champ inconnu avec schéma strict, type incorrect, statut interdit, etc.). |
| `401` | Clé absente, invalide ou révoquée. |
| `403` | Article d’un autre auteur ; ou article déjà publié ; ou statut non autorisé. |
| `404` | `PATCH` sur un `id` inexistant. |
| `503` | Base non configurée. |

Corps d’erreur de validation (exemple) : `{ "error": "Invalid body", "code": "VALIDATION_ERROR", "details": { ... } }`.

Si vous envoyez une clé **non prévue** (ex. `author_id`), le détail contient typiquement :

`"Unrecognized key(s) in object: 'author_id'"` — le schéma est **strict** pour éviter toute ambiguïté.

---

## Ce qui est interdit ou hors périmètre

- Publier (`published`) ou passer en `scheduled` côté Writer pour une mise en ligne autonome.
- Envoyer un **`author_id`** (ou tout champ non listé) — **rejeté** par le schéma strict.
- Modifier un article dont vous n’êtes pas l’auteur.
- Toute route autre que **`POST /writer/articles`** et **`PATCH /writer/articles/:id`**.

---

## Exemples cURL

### Création (texte brut)

```bash
API="https://<backend>/api/v1"
KEY="saw_xxxxxxxx"

curl -sS -X POST "$API/writer/articles" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test LLM","body_text":"Hello world."}'
```

### Mise à jour (passage en relecture)

```bash
ARTICLE_ID="<uuid-renvoye-au-POST>"

curl -sS -X PATCH "$API/writer/articles/$ARTICLE_ID" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"status":"review"}'
```

---

## Bonnes pratiques sécurité

- Stockez la clé dans un **gestionnaire de secrets**, jamais dans le dépôt Git ni dans des captures d’écran partagées.
- **Révoquez** toute clé exposée et créez-en une nouvelle depuis `/admin/writer-api`.
- Vérifiez les brouillons dans **Articles** avant demande de publication.

---

## Référence technique (implémentation)

- Routes : `apps/backend/src/routes/writer-articles.ts`
- Schémas : `apps/backend/src/schemas/writer-article.ts` (schéma **strict**, `status` forcé à `draft` à la création)
