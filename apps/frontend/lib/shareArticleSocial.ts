/**
 * Textes de partage adaptes par reseau (longueurs, hashtags, phrase de lien).
 */

export const SHARE_SITE_LABEL = 'Scoop.Afrique'

function normalizeTag(raw: string): string {
  return raw.replace(/^#/, '').replace(/\s+/g, '').trim()
}

function formatHashtags(tags: string[], max: number): string {
  const out: string[] = []
  for (const t of tags) {
    const w = normalizeTag(t)
    if (!w) continue
    out.push(`#${w}`)
    if (out.length >= max) break
  }
  return out.join(' ')
}

export interface ShareArticleInput {
  title: string
  excerpt: string | null
  tags: string[]
  categoryName: string | null
  url: string
}

export interface NetworkShareTexts {
  whatsapp: string
  telegram: string
  twitterText: string
  facebookQuote: string
  linkedInClipboard: string
  nativeShareText: string
}

export function buildNetworkShareTexts(input: ShareArticleInput): NetworkShareTexts {
  const excerpt = (input.excerpt ?? '').replace(/\s+/g, ' ').trim()
  const shortExcerpt = excerpt.length > 220 ? `${excerpt.slice(0, 217)}…` : excerpt
  const microExcerpt = excerpt.length > 120 ? `${excerpt.slice(0, 117)}…` : excerpt
  const hashtagsMax5 = formatHashtags(input.tags, 5)
  const hashtagsMax2 = formatHashtags(input.tags, 2)
  const cat = input.categoryName?.trim()
  const catHash = cat ? `#${normalizeTag(cat)}` : ''
  const hashBlock = [hashtagsMax5, catHash].filter(Boolean).join(' ')
  const hashBlockShort = [hashtagsMax2, catHash].filter(Boolean).join(' ')
  const linkPhrase = `Lire l\u2019article complet sur ${SHARE_SITE_LABEL} : ${input.url}`

  const whatsapp = [`*${input.title}*`, '', shortExcerpt || '—', '', hashBlock, '', linkPhrase].join('\n')

  const telegram = [input.title, '', shortExcerpt || '—', '', hashBlock, '', linkPhrase].join('\n')

  const twitterCta = `\n\n-> ${SHARE_SITE_LABEL} (lien ci-dessous)`
  let twitterText = [
    input.title,
    microExcerpt ? `\n\n${microExcerpt}` : '',
    hashBlockShort ? `\n\n${hashBlockShort}` : '',
    twitterCta,
  ].join('')

  if (twitterText.length > 240) {
    twitterText = [input.title, hashBlockShort ? `\n\n${hashBlockShort}` : '', twitterCta].join('')
  }
  if (twitterText.length > 260) {
    twitterText = `${input.title.slice(0, 180)}${input.title.length > 180 ? '…' : ''}${twitterCta}`
  }

  const facebookQuote = [input.title, '', shortExcerpt || '—', '', hashBlock, '', linkPhrase].join('\n')

  const linkedInClipboard = [
    input.title,
    '',
    excerpt || shortExcerpt || '—',
    '',
    hashBlock,
    '',
    linkPhrase,
    '',
    '#Afrique #Media #Actualite',
  ].join('\n')

  const nativeShareText = [input.title, '', shortExcerpt || excerpt || '', '', linkPhrase].join('\n')

  return {
    whatsapp,
    telegram,
    twitterText,
    facebookQuote,
    linkedInClipboard,
    nativeShareText,
  }
}

export function shareHrefWhatsApp(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function shareHrefTelegram(url: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
}

export function shareHrefTwitter(url: string, text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

export function shareHrefFacebook(url: string, quote: string): string {
  const q = quote.slice(0, 2800)
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(q)}`
}

export function shareHrefLinkedIn(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}
