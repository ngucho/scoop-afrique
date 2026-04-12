/**
 * Valeurs contrôlées pour la saisie KPI (audience_metric_snapshots).
 * Élargir cette liste au fil des besoins produit / reporting.
 */

export const AUDIENCE_PLATFORM_OPTIONS: { value: string; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'threads', label: 'Threads' },
  { value: 'bluesky', label: 'Bluesky' },
  { value: 'site', label: 'Site web (global)' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'podcast', label: 'Podcast / audio' },
  { value: 'other', label: 'Autre plateforme' },
]

/** Clés métier courantes ; « custom » gère une saisie libre contrôlée côté UI. */
export const AUDIENCE_METRIC_KEY_OPTIONS: { value: string; label: string }[] = [
  { value: 'followers', label: 'Abonnés / followers' },
  { value: 'following', label: 'Abonnements suivis' },
  { value: 'reach', label: 'Portée (reach)' },
  { value: 'impressions', label: 'Impressions' },
  { value: 'engagement', label: 'Engagement (agrégé)' },
  { value: 'likes', label: 'J’aime / likes' },
  { value: 'comments', label: 'Commentaires' },
  { value: 'shares', label: 'Partages' },
  { value: 'saves', label: 'Enregistrements' },
  { value: 'views', label: 'Vues (vidéo / contenu)' },
  { value: 'subscribers', label: 'Abonnés (newsletter / flux)' },
  { value: 'open_rate', label: 'Taux d’ouverture (email)' },
  { value: 'click_rate', label: 'Taux de clic (email)' },
  { value: 'sessions', label: 'Sessions (site)' },
  { value: 'unique_visitors', label: 'Visiteurs uniques' },
  { value: 'pageviews', label: 'Pages vues' },
  { value: 'custom', label: 'Autre (saisie libre)' },
]

export const AUDIENCE_SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'manual', label: 'Saisie manuelle (back-office)' },
  { value: 'cron', label: 'Import / job planifié' },
  { value: 'api_provider', label: 'API fournisseur (Meta, etc.)' },
  { value: 'analytics_export', label: 'Export analytics (GA, etc.)' },
  { value: 'spreadsheet', label: 'Import tableur' },
  { value: 'estimate', label: 'Estimation / consolidation interne' },
]
