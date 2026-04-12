/**
 * Réseaux Scoop.Afrique — alignés sur ReaderFooter (CTA aléatoire emplacements pub).
 */
export const SCOOP_SOCIAL_CTA_POOL = [
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://tiktok.com/@Scoop.Afrique',
    cta: 'Suivre sur TikTok',
    accent: 'from-cyan-400/40 via-pink-500/35 to-rose-600/30',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://facebook.com/profile.php?id=61568464568442',
    cta: 'Rejoindre sur Facebook',
    accent: 'from-blue-600/35 via-blue-500/30 to-sky-400/25',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://instagram.com/Scoop.Afrique',
    cta: 'Suivre sur Instagram',
    accent: 'from-fuchsia-600/35 via-pink-500/30 to-amber-400/25',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://youtube.com/@Scoop.Afrique',
    cta: "S'abonner sur YouTube",
    accent: 'from-red-600/40 via-red-500/30 to-orange-500/25',
  },
  {
    id: 'threads',
    label: 'Threads',
    href: 'https://threads.net/@Scoop.Afrique',
    cta: 'Suivre sur Threads',
    accent: 'from-neutral-700/40 via-neutral-600/30 to-neutral-500/25',
  },
] as const

export type ScoopSocialCta = (typeof SCOOP_SOCIAL_CTA_POOL)[number]

export function slotKeyHash(slotKey: string): number {
  let h = 0
  for (let i = 0; i < slotKey.length; i++) h = (h * 31 + slotKey.charCodeAt(i)) | 0
  return Math.abs(h)
}
