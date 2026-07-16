# JSON Import Backoffice

Le backoffice accepte :

```json
{
  "articles": [
    {
      "title": "Titre complet de l'article",
      "excerpt": "Chapeau lisible de 1-2 phrases.",
      "rubrique": "Politique",
      "category": "Politique",
      "category_slug": "politique",
      "body": "Corps de l'article en paragraphes separes par une ligne vide.",
      "tags": ["Cote d'Ivoire", "Politique", "Scoop Afrique"],
      "meta_title": "Titre SEO | Scoop Afrique",
      "meta_description": "Description SEO concise."
    }
  ]
}
```

## Champs Obligatoires Pour La Livraison

- `title` : obligatoire, au moins 10 caracteres recommande.
- `excerpt` : obligatoire pour que le journaliste puisse soumettre plus tard.
- `body` : obligatoire, 250-350 mots vises.
- `rubrique`, `category_slug` ou `category` : obligatoire meme si la rubrique risque d'etre corrigee manuellement.
- `tags` : tableau de chaines, max 20.
- `meta_title` ou `meta_description` : obligatoire dans le workflow editorial.

## Rubriques

Preferer `category_slug` si la rubrique existe dans le backoffice.

Si la rubrique proposee n'est pas certaine :

- renseigner `rubrique` avec le libelle propose ;
- ne pas inventer de `category_id` ;
- ajouter l'article dans la liste "rubrique a corriger" des notes et de Notion.

## Media

L'import cree des brouillons. L'agent IA ne doit pas renseigner les champs media.

Ne pas inclure dans le JSON final :

- `cover_image_url`
- `cover_image_credit`
- `cover_image_source`
- `video_url`
- `cover_video_credit`

Le journaliste doit lire l'article, fact-checker, choisir les illustrations adaptees, puis ajouter les images ou videos depuis le backoffice.

Pour soumission ou publication ulterieure, l'article devra respecter les 7 conditions du backoffice :

1. titre solide ;
2. chapeau lisible ;
3. rubrique choisie ;
4. corps developpe ;
5. visuel de carte ;
6. lien video valide si renseigne ;
7. SEO precise.

## Interdits

- Ne pas mettre de commentaires dans le JSON.
- Ne pas ajouter de champs internes dans le JSON final si le fichier est destine a l'import.
- Ne pas inclure les sources de controle dans `body` sous forme de notes internes.
- Ne pas fournir de liens image, video ou media : c'est une responsabilite editoriale du journaliste.
- Ne pas publier ni soumettre depuis ce workflow.
