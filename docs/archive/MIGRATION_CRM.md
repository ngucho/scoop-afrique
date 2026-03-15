# Migration base de données — CRM

> **Déprécié** — Ce document est archivé. Voir [PROJECT_GUIDE.md §10](../PROJECT_GUIDE.md#10-migration-order-reference) pour l'ordre complet des migrations.

---

Pour appliquer les migrations CRM (conversion devis_requests, catalogue prestations) :

```bash
# 1. Se connecter à Supabase (si pas déjà fait)
npx supabase login

# 2. Lier le projet (si pas déjà fait)
npx supabase link --project-ref <votre-project-ref>

# 3. Appliquer les migrations
npx supabase db push
```

Ou exécuter manuellement les fichiers SQL dans l'ordre :

1. `supabase/migrations/20260314110000_devis_requests_conversion.sql` — colonnes de conversion pour devis_requests
2. `supabase/migrations/20260315100000_crm_services.sql` — table crm_services (catalogue des prestations)
