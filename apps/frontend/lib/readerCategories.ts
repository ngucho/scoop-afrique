/** Synced with seed categories (pan-African media). Shared by server and client. */
export const READER_CATEGORIES = [
  { slug: 'actualites', label: 'Actualités' },
  { slug: 'politique', label: 'Politique' },
  { slug: 'economie', label: 'Économie' },
  { slug: 'societe', label: 'Société' },
  { slug: 'culture', label: 'Culture' },
  { slug: 'sport', label: 'Sport' },
  { slug: 'opinions', label: 'Opinions' },
  { slug: 'dossiers', label: 'Dossiers' },
  { slug: 'videos', label: 'Vidéos' },
  { slug: 'sante', label: 'Santé' },
  { slug: 'environnement', label: 'Environnement' },
  { slug: 'technologie', label: 'Technologie' },
  { slug: 'genre', label: 'Genre' },
] as const

export type ReaderCategorySlug = (typeof READER_CATEGORIES)[number]['slug']
