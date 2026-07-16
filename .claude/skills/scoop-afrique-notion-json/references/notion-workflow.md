# Workflow Notion

Objectif : garder une trace editoriale exploitable entre la veille, la validation, la redaction, l'import JSON et les corrections manuelles.

## Connexion

Si un connecteur ou MCP Notion est disponible, l'utiliser pour :

1. chercher une base ou page nommee `Scoop Afrique`, `Veille`, `Production`, `Articles`, ou selon l'indication utilisateur ;
2. lire les proprietes existantes avant d'ecrire ;
3. creer les champs manquants seulement si l'outil et les permissions le permettent ;
4. sinon, adapter les donnees aux champs existants sans perte critique.

Si Notion n'est pas disponible, produire une table Markdown "Notion a creer" et ne pas pretendre que la synchronisation a ete faite.

## Proprietes Recommandees

| Propriete | Type Notion | Contenu |
| --- | --- | --- |
| `Date` | Date | Date du cycle |
| `Topic ID` | Number | Rang dans la veille |
| `Titre veille` | Title/Text | Titre du sujet selectionne |
| `Titre CMS` | Text | Titre final de l'article |
| `Statut` | Select | Veille, Valide, Redige, Pret import, Importe, A completer |
| `Pays` | Select/Text | Pays principal |
| `Pilier` | Select | Politique, Societe, Economie, Sport, Culture, Tech, Sante |
| `Rubrique proposee` | Text | Rubrique envoyee dans le JSON |
| `Rubrique a corriger` | Checkbox | Oui si la rubrique n'est pas reconnue |
| `Media a ajouter` | Checkbox | Toujours oui apres redaction IA ; le journaliste choisit les illustrations |
| `Sources` | URL/Text | Sources principales, une par ligne si possible |
| `Score` | Number | Score veille |
| `Cluster ID` | Text | Identifiant anti-doublon |
| `Slug` | Text | Slug propose si fourni |
| `JSON pret` | Checkbox | Oui quand l'article est dans le fichier final |

## Statuts

- `Veille` : sujet candidat ou retenu avant validation.
- `Valide` : sujet accepte par l'utilisateur.
- `Redige` : corps article ecrit et relu.
- `Pret import` : entree presente dans le JSON final.
- `Importe` : brouillon cree dans le backoffice.
- `A completer` : rubrique, image, video ou verification manquante.

## Synchronisation

Pendant la veille :

- creer ou mettre a jour une ligne par sujet retenu ;
- renseigner pays, pilier, score, cluster, sources et statut `Veille`.

Apres validation :

- passer les sujets valides en `Valide` ;
- marquer les sujets rejetes ou remplaces si le schema Notion le permet.

Apres redaction JSON :

- passer les articles en `Pret import` ;
- cocher `Rubrique a corriger` si la rubrique n'est pas dans la liste backoffice ;
- cocher `Media a ajouter` pour chaque article ;
- ajouter le chemin du fichier JSON dans une propriete texte ou dans le commentaire de page.

Apres import manuel :

- si l'utilisateur fournit le resultat d'import, passer en `Importe` les articles crees ;
- laisser `A completer` pour les articles avec rubrique ou media manquant.

## Regles De Prudence

- Ne pas supprimer de pages Notion.
- Ne pas ecraser un article existant sans correspondance claire par titre, date et topic ID.
- Ne pas stocker de secrets, tokens API ou credentials dans Notion.
- Ne pas stocker de liens image ou video proposes par l'IA ; garder seulement les sources journalistiques et l'alerte media a completer.
- Toujours signaler les actions Notion realisees et celles qui restent manuelles.
