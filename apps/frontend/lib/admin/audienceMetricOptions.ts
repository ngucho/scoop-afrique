/**
 * Valeurs contrôlées pour la saisie KPI (audience_metric_snapshots).
 */

export const AUDIENCE_PLATFORM_OPTIONS: { value: string; label: string; emoji: string; color: string }[] = [
  { value: 'instagram',   label: 'Instagram',         emoji: '📸', color: '#E4405F' },
  { value: 'tiktok',      label: 'TikTok',             emoji: '🎵', color: '#010101' },
  { value: 'facebook',    label: 'Facebook',           emoji: '👥', color: '#1877F2' },
  { value: 'youtube',     label: 'YouTube',            emoji: '▶️', color: '#FF0000' },
  { value: 'x',           label: 'X (Twitter)',        emoji: '𝕏',  color: '#333333' },
  { value: 'linkedin',    label: 'LinkedIn',           emoji: '💼', color: '#0A66C2' },
  { value: 'threads',     label: 'Threads',            emoji: '🧵', color: '#000000' },
  { value: 'bluesky',     label: 'Bluesky',            emoji: '🦋', color: '#0085FF' },
  { value: 'site',        label: 'Site web',           emoji: '🌐', color: '#6366F1' },
  { value: 'newsletter',  label: 'Newsletter',         emoji: '📧', color: '#F59E0B' },
  { value: 'podcast',     label: 'Podcast / audio',    emoji: '🎙️', color: '#8B5CF6' },
  { value: 'other',       label: 'Autre plateforme',   emoji: '📊', color: '#6B7280' },
]

/** Métriques pertinentes par plateforme (affichées en priorité dans le formulaire) */
export const PLATFORM_RELEVANT_METRICS: Record<string, string[]> = {
  instagram:  ['followers', 'reach', 'impressions', 'engagement', 'likes', 'comments', 'saves', 'views'],
  tiktok:     ['followers', 'views', 'likes', 'comments', 'shares', 'reach'],
  facebook:   ['followers', 'reach', 'impressions', 'engagement', 'likes', 'shares', 'comments'],
  youtube:    ['subscribers', 'views', 'impressions', 'likes', 'comments'],
  x:          ['followers', 'impressions', 'engagement', 'likes', 'shares'],
  linkedin:   ['followers', 'impressions', 'engagement', 'shares'],
  threads:    ['followers', 'likes', 'shares', 'reach'],
  bluesky:    ['followers', 'likes', 'shares'],
  site:       ['sessions', 'unique_visitors', 'pageviews'],
  newsletter: ['subscribers', 'open_rate', 'click_rate'],
  podcast:    ['subscribers', 'views', 'reach'],
  other:      ['followers', 'reach', 'impressions', 'engagement'],
}

/** Métrique principale (affiché en grand sur la carte plateforme) */
export const PLATFORM_KEY_METRIC: Record<string, string> = {
  instagram:  'followers',
  tiktok:     'followers',
  facebook:   'followers',
  youtube:    'subscribers',
  x:          'followers',
  linkedin:   'followers',
  threads:    'followers',
  bluesky:    'followers',
  site:       'sessions',
  newsletter: 'subscribers',
  podcast:    'subscribers',
  other:      'followers',
}

export const AUDIENCE_METRIC_KEY_OPTIONS: { value: string; label: string }[] = [
  { value: 'followers',        label: 'Abonnés / followers' },
  { value: 'subscribers',      label: 'Abonnés (newsletter / flux)' },
  { value: 'following',        label: 'Abonnements suivis' },
  { value: 'reach',            label: 'Portée (reach)' },
  { value: 'impressions',      label: 'Impressions' },
  { value: 'engagement',       label: 'Engagement (agrégé)' },
  { value: 'likes',            label: "J'aime / likes" },
  { value: 'comments',         label: 'Commentaires' },
  { value: 'shares',           label: 'Partages' },
  { value: 'saves',            label: 'Enregistrements' },
  { value: 'views',            label: 'Vues (vidéo / contenu)' },
  { value: 'open_rate',        label: "Taux d'ouverture (email)" },
  { value: 'click_rate',       label: 'Taux de clic (email)' },
  { value: 'sessions',         label: 'Sessions (site)' },
  { value: 'unique_visitors',  label: 'Visiteurs uniques' },
  { value: 'pageviews',        label: 'Pages vues' },
  { value: 'custom',           label: 'Autre (saisie libre)' },
]

export const AUDIENCE_SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'manual',            label: 'Saisie manuelle (back-office)' },
  { value: 'cron',              label: 'Import / job planifié' },
  { value: 'api_provider',      label: 'API fournisseur (Meta, etc.)' },
  { value: 'analytics_export',  label: 'Export analytics (GA, etc.)' },
  { value: 'spreadsheet',       label: 'Import tableur' },
  { value: 'estimate',          label: 'Estimation / consolidation interne' },
]
