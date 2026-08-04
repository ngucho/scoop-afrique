# CRM Scoop Afrique — suite proposée après audit

Ce fichier ne lance aucune implémentation. Il sert de checklist de décision.

## Étape 1 — Validation métier

- [ ] Valider la politique de conservation des factures, paiements, reçus, devis et contrats.
- [ ] Choisir le comportement des tâches, livrables et relances lors de l'archivage projet.
- [ ] Choisir les rôles autorisés à archiver, restaurer et purger.
- [ ] Valider la terminologie UX : archiver, annuler, clôturer, supprimer définitivement.

## Étape 2 — Priorités bloquantes

- [ ] Corriger la vérification cryptographique des JWT Auth0.
- [ ] Séparer strictement `read:crm`, `write:crm` et `manage:crm`.
- [ ] Ajouter des tests d'autorisation et de régression CRM.

## Étape 3 — Cycle de vie projet

- [ ] Concevoir l'aperçu d'impact avant archivage.
- [ ] Ajouter `archived_at`, `archived_by`, `archive_reason` et origine de l'archive.
- [ ] Implémenter une transaction d'archivage/restauration du dossier.
- [ ] Aligner dashboard, listes, relances et rapports.
- [ ] Préparer une correction contrôlée des 2 devis et 1 facture actifs sur projets archivés.

## Étape 4 — Fiabilité et UX

- [ ] Ajouter un journal de livraison des emails/WhatsApp.
- [ ] Envoyer réellement le reçu après paiement.
- [ ] Remplacer les URL PDF expirantes par des chemins stables signés à la demande.
- [ ] Ajouter pagination, recherche globale et dialogues accessibles.
- [ ] Rendre l'interface cohérente avec les permissions du rôle courant.

## Vérification attendue pour chaque lot

- [ ] Tests CRM ciblés réussis.
- [ ] Lint CRM sans erreur.
- [ ] Build backend réussi.
- [ ] Build CRM réussi.
- [ ] Parcours vérifié dans un navigateur avec comptes lecture, écriture et administration.
- [ ] Aucune donnée financière supprimée sans validation métier explicite.
