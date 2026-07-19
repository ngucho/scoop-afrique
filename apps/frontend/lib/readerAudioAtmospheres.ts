const DEFAULT_ASSET_BASE_URL =
  'https://tgotzuqlashlnxjtnrwq.supabase.co/storage/v1/object/public/reader-audio-assets/ambiences'

const ASSET_BASE_URL =
  process.env.NEXT_PUBLIC_READER_AUDIO_ASSETS_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_ASSET_BASE_URL

function audioAsset(filename: string) {
  const encodedFilename = filename.split('/').map(encodeURIComponent).join('/')
  return `${ASSET_BASE_URL}/${encodedFilename}`
}

export interface ReaderAudioAtmosphere {
  key: string
  label: string
  url: string
  attribution: string
}

const ATMOSPHERES: ReaderAudioAtmosphere[] = [
  {
    key: 'backbay-lounge',
    label: 'Backbay Lounge',
    url: audioAsset('Backbay Lounge.mp3'),
    attribution: 'Backbay Lounge - ambiance musicale fournie par Scoop Afrique',
  },
  {
    key: 'backed-vibes',
    label: 'Backed Vibes',
    url: audioAsset('Backed Vibes Clean.mp3'),
    attribution: 'Backed Vibes Clean - ambiance musicale fournie par Scoop Afrique',
  },
  {
    key: 'bass-vibes',
    label: 'Bass Vibes',
    url: audioAsset('Bass Vibes.mp3'),
    attribution: 'Bass Vibes - ambiance musicale fournie par Scoop Afrique',
  },
  {
    key: 'on-the-ground',
    label: 'On the Ground',
    url: audioAsset('On the Ground.mp3'),
    attribution: 'On the Ground - ambiance musicale fournie par Scoop Afrique',
  },
  {
    key: 'slow-heat',
    label: 'Slow Heat',
    url: audioAsset('Slow Heat.mp3'),
    attribution: 'Slow Heat - ambiance musicale fournie par Scoop Afrique',
  },
  {
    key: 'whimsy-groove',
    label: 'Whimsy Groove',
    url: audioAsset('Whimsy Groove.mp3'),
    attribution: 'Whimsy Groove - ambiance musicale fournie par Scoop Afrique',
  },
]

const CATEGORY_ATMOSPHERE: Record<string, string> = {
  culture: 'backbay-lounge',
  actualites: 'slow-heat',
  politique: 'on-the-ground',
  economie: 'backed-vibes',
  sport: 'bass-vibes',
  sports: 'bass-vibes',
  environnement: 'whimsy-groove',
  societe: 'slow-heat',
}

export function readerAudioAtmosphereForCategory(categorySlug?: string | null): ReaderAudioAtmosphere {
  const key = categorySlug ? CATEGORY_ATMOSPHERE[categorySlug] : undefined
  return ATMOSPHERES.find((item) => item.key === key) ?? ATMOSPHERES[0]
}
